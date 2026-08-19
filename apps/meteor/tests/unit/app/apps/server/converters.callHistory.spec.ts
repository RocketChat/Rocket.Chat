import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { AppCallHistoryConverter } from '../../../../../app/apps/server/converters/callHistory';

const ts = new Date('2026-01-01T00:00:00.000Z');
const endedAt = new Date('2026-01-01T00:05:00.000Z');

const internalItem = {
	_id: 'history-internal',
	uid: 'caller-id',
	ts,
	endedAt,
	callId: 'call-1',
	direction: 'outbound',
	state: 'ended',
	type: 'media-call',
	duration: 42,
	external: false,
	contactId: 'callee-id',
	contactName: 'Jane Callee',
	contactUsername: 'jane',
	rid: 'room-1',
	messageId: 'message-1',
} as unknown as CallHistoryItem;

const externalItem = {
	_id: 'history-external',
	uid: 'caller-id',
	ts,
	endedAt,
	callId: 'call-2',
	direction: 'inbound',
	state: 'not-answered',
	type: 'media-call',
	duration: 0,
	external: true,
	contactExtension: '+5511999998888',
} as unknown as CallHistoryItem;

/**
 * A full media call, credentials included. The point of most assertions below is what the
 * converter refuses to copy out of this.
 */
const call = {
	_id: 'call-1',
	_updatedAt: endedAt,
	service: 'webrtc',
	kind: 'direct',
	state: 'hangup',
	createdBy: { type: 'user', id: 'caller-id', contractId: 'created-by-contract' },
	createdAt: ts,
	caller: { type: 'user', id: 'caller-id', contractId: 'caller-contract' },
	callee: { type: 'user', id: 'callee-id', contractId: 'callee-contract' },
	ended: true,
	endedBy: { type: 'user', id: 'callee-id', contractId: 'ended-by-contract' },
	endedAt,
	hangupReason: 'sip-error-486',
	expiresAt: endedAt,
	acceptedAt: ts,
	activatedAt: ts,
	callerRequestedId: 'requested-id',
	parentCallId: 'parent-call',
	transferredAt: ts,
	uids: ['caller-id', 'callee-id'],
	features: ['audio', 'video'],
} as unknown as IMediaCall;

describe('AppCallHistoryConverter', () => {
	const converter = new AppCallHistoryConverter();

	describe('convertItem', () => {
		it('flattens an internal row into a user contact', () => {
			expect(converter.convertItem(internalItem)).to.deep.equal({
				id: 'history-internal',
				callId: 'call-1',
				uid: 'caller-id',
				ts,
				endedAt,
				direction: 'outbound',
				state: 'ended',
				durationSeconds: 42,
				contact: { type: 'user', userId: 'callee-id', username: 'jane', displayName: 'Jane Callee' },
				roomId: 'room-1',
				messageId: 'message-1',
			});
		});

		it('flattens an external row into a numbered contact, with no room', () => {
			const result = converter.convertItem(externalItem);

			expect(result.contact).to.deep.equal({ type: 'external', number: '+5511999998888' });
			expect(result.durationSeconds).to.equal(0);
			expect(result).to.not.have.property('roomId');
			expect(result).to.not.have.property('messageId');
		});

		it('returns undefined for a missing row', () => {
			expect(converter.convertItem(undefined)).to.equal(undefined);
			expect(converter.convertItem(null)).to.equal(undefined);
		});

		// The vendor CDR variant carries a foreign call id and is not part of the published SDK.
		// Refusing it here is the backstop for a caller that forgets to filter by type.
		it('refuses a history variant that is not a media call', () => {
			const mitelItem = { ...internalItem, type: 'mitel' } as unknown as CallHistoryItem;

			expect(() => converter.convertItem(mitelItem)).to.throw(/unsupported call history type "mitel"/);
		});
	});

	describe('convertCallDetails', () => {
		it('copies the audit fields', () => {
			expect(converter.convertCallDetails(call)).to.deep.equal({
				state: 'hangup',
				hangupReason: 'sip-error-486',
				endedBy: { type: 'user', id: 'callee-id' },
				acceptedAt: ts,
				activatedAt: ts,
				endedAt,
				transferredAt: ts,
				parentCallId: 'parent-call',
				features: ['audio', 'video'],
			});
		});

		it('returns undefined for a missing call', () => {
			expect(converter.convertCallDetails(undefined)).to.equal(undefined);
			expect(converter.convertCallDetails(null)).to.equal(undefined);
		});

		// `contractId` is a per-session signing credential. A regression that reintroduces it —
		// by spreading the source document, or by switching to an unmapped-bucket codec — is the
		// failure this test exists to catch, so it scans the whole serialized payload rather than
		// naming the fields it expects.
		it('leaks no credential or internal field, at any depth', () => {
			const serialized = JSON.stringify(converter.convertCallDetails(call));

			expect(serialized).to.not.contain('contractId');
			expect(serialized).to.not.contain('contract');
			expect(serialized).to.not.contain('expiresAt');
			expect(serialized).to.not.contain('callerRequestedId');
			expect(serialized).to.not.contain('requested-id');
		});

		it('drops the contacts entirely rather than filtering them', () => {
			const details = converter.convertCallDetails(call);

			expect(details).to.not.have.property('caller');
			expect(details).to.not.have.property('callee');
			expect(details).to.not.have.property('createdBy');
			expect(details).to.not.have.property('uids');
		});

		it('reports an absent feature list as empty rather than undefined', () => {
			const featureless = { ...call, features: undefined } as unknown as IMediaCall;

			expect(converter.convertCallDetails(featureless).features).to.deep.equal([]);
		});
	});

	describe('convertEntry', () => {
		it('pairs a row with its call', () => {
			const entry = converter.convertEntry(internalItem, call);

			expect(entry.item.id).to.equal('history-internal');
			expect(entry.call?.hangupReason).to.equal('sip-error-486');
		});

		it('omits the call key when the call is gone', () => {
			expect(converter.convertEntry(internalItem)).to.not.have.property('call');
			expect(converter.convertEntry(internalItem, null)).to.not.have.property('call');
		});

		it('leaks no credential through the paired entry either', () => {
			expect(JSON.stringify(converter.convertEntry(internalItem, call))).to.not.contain('contract');
		});
	});
});
