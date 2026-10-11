import type { IMediaCall } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

/**
 * Other spec files in this suite call the global `sinon.restore()`, which detaches every stub from the
 * default sandbox. These stubs live in their own sandbox so that `sandbox.reset()` keeps working.
 */
const sandbox = sinon.createSandbox();

/**
 * The history pipeline is exercised through the service's private methods. The constructor only wires
 * emitters and configures the call server, so every collaborator it touches is a stub.
 */
const callServerMock = { emitter: { on: sandbox.stub() }, setHooks: sandbox.stub(), configure: sandbox.stub() };

const CallHistory = { insertOne: sandbox.stub(), insertMany: sandbox.stub(), updateMany: sandbox.stub() };
const MediaCalls = { findOneById: sandbox.stub() };
const Rooms = { findOneDirectRoomContainingAllUserIDs: sandbox.stub() };
const Users = { findOneById: sandbox.stub(), findByIds: sandbox.stub() };

const sendMessage = sandbox.stub();
const callStateToTranslationKey = sandbox.stub();
const getHistoryMessagePayload = sandbox.stub();

const loggerMock = { info: sandbox.stub(), warn: sandbox.stub(), error: sandbox.stub(), debug: sandbox.stub() };

class ServiceClassInternalMock {
	protected name = '';

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onEvent(): void {}
}

const { MediaCallService } = proxyquire.noCallThru().load('../../../../../server/services/media-call/service', {
	'@rocket.chat/core-services': {
		ServiceClassInternal: ServiceClassInternalMock,
		api: { broadcast: sandbox.stub() },
		Presence: {},
		Authorization: {},
	},
	'@rocket.chat/media-calls': { callServer: callServerMock, getSignalsForExistingCall: sandbox.stub() },
	'@rocket.chat/media-signaling': { isClientMediaSignal: sandbox.stub() },
	'@rocket.chat/models': { CallHistory, MediaCalls, Rooms, Users },
	'@rocket.chat/ui-voip/dist/ui-kit/getHistoryMessagePayload': { callStateToTranslationKey, getHistoryMessagePayload },
	'./appEvents': {
		notifyAppsOfMediaCallEnded: sandbox.stub(),
		notifyAppsOfMediaCallParticipantJoined: sandbox.stub(),
		notifyAppsOfMediaCallStarted: sandbox.stub(),
		runPreMediaCallCreatedAppHook: sandbox.stub(),
	},
	'./logger': { logger: loggerMock },
	'./push/sendVoipPushNotification': { sendVoipPushNotification: sandbox.stub() },
	'../../lib/i18n': { i18n: { t: sandbox.stub().returns('text') } },
	'../../lib/messages/sendMessage': { sendMessage },
	'../../meteor-methods/messages/createDirectMessage': { createDirectMessage: sandbox.stub() },
	'../../settings': { settings: { get: sandbox.stub().returns(undefined) } },
});

const preventedBy = { appId: 'call-policy', appName: 'Call Policy', text: 'the callee is on a DND list' };

function makeCall(overrides: Partial<IMediaCall> = {}): IMediaCall {
	return {
		_id: 'call-id',
		service: 'webrtc',
		kind: 'direct',
		state: 'hangup',
		createdBy: { type: 'user', id: 'caller-id', username: 'caller' },
		createdAt: new Date('2026-01-01T10:00:00.000Z'),
		caller: { type: 'user', id: 'caller-id', username: 'caller', displayName: 'The Caller' },
		callee: { type: 'user', id: 'callee-id', username: 'callee', displayName: 'The Callee' },
		ended: true,
		endedAt: new Date('2026-01-01T10:00:00.000Z'),
		expiresAt: new Date('2026-01-01T10:00:00.000Z'),
		uids: ['caller-id', 'callee-id'],
		features: [],
		...overrides,
	} as unknown as IMediaCall;
}

describe('media call history pipeline', () => {
	let service: any;

	beforeEach(() => {
		sandbox.reset();
		Rooms.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'rid' });
		Users.findOneById.resolves({ _id: 'caller-id', language: 'en' });
		callStateToTranslationKey.returns({ type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' });
		getHistoryMessagePayload.returns({ msg: '', groupable: false, blocks: [] });
		sendMessage.resolves({ _id: 'message-id' });
		CallHistory.insertOne.resolves({ insertedId: 'history-id' });
		CallHistory.insertMany.resolves({});
		CallHistory.updateMany.resolves({});

		service = new MediaCallService();
	});

	describe('getCallHistoryItemState', () => {
		it('returns "prevented" ahead of every other state', () => {
			// Even with fields that would otherwise read as transferred or errored, a prevented call wins.
			const state = service.getCallHistoryItemState(
				makeCall({
					preventedBy,
					transferredBy: { type: 'user', id: 'x' },
					hangupReason: 'error',
					acceptedAt: new Date(),
					activatedAt: new Date(),
				} as Partial<IMediaCall>),
			);

			expect(state).to.equal('prevented');
		});

		it('does not return "prevented" for an ordinary ended call', () => {
			const state = service.getCallHistoryItemState(makeCall({ acceptedAt: new Date(), activatedAt: new Date() } as Partial<IMediaCall>));

			expect(state).to.equal('ended');
		});
	});

	it('leaves one internal history entry, for the caller only, when a call is prevented', async () => {
		MediaCalls.findOneById.resolves(makeCall({ preventedBy }));

		await service.saveCallToHistory('call-id');

		expect(CallHistory.insertMany.calledOnce).to.be.true;

		const [items] = CallHistory.insertMany.firstCall.args;
		expect(items).to.have.lengthOf(1);
		expect(items[0]).to.include({ uid: 'caller-id', direction: 'outbound', state: 'prevented' });
		expect(items.some((item: { uid: string }) => item.uid === 'callee-id')).to.be.false;
	});

	it('still leaves two entries for an ordinary internal call', async () => {
		MediaCalls.findOneById.resolves(makeCall({ acceptedAt: new Date(), activatedAt: new Date() } as Partial<IMediaCall>));

		await service.saveCallToHistory('call-id');

		const [items] = CallHistory.insertMany.firstCall.args;
		expect(items).to.have.lengthOf(2);
	});

	it('leaves one outbound entry for the caller on a prevented outbound call', async () => {
		MediaCalls.findOneById.resolves(
			makeCall({
				preventedBy,
				callee: { type: 'external', id: 'callee-ext', sipExtension: '2002' },
				uids: ['caller-id'],
			} as unknown as Partial<IMediaCall>),
		);

		await service.saveCallToHistory('call-id');

		expect(CallHistory.insertOne.calledOnce).to.be.true;
		expect(CallHistory.insertOne.firstCall.args[0]).to.include({ uid: 'caller-id', direction: 'outbound', state: 'prevented' });
	});

	it('leaves one inbound entry for the called person on a prevented inbound call', async () => {
		MediaCalls.findOneById.resolves(
			makeCall({
				preventedBy,
				caller: { type: 'external', id: 'caller-ext', sipExtension: '2002' },
				uids: ['callee-id'],
			} as unknown as Partial<IMediaCall>),
		);

		await service.saveCallToHistory('call-id');

		expect(CallHistory.insertOne.calledOnce).to.be.true;
		expect(CallHistory.insertOne.firstCall.args[0]).to.include({ uid: 'callee-id', direction: 'inbound', state: 'prevented' });
	});
});
