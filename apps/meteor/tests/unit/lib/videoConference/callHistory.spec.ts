import type { IGroupVideoConference, IVideoConferenceUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { buildConferenceCallHistoryItems, hasActiveParticipants, isLoggableConference } from '../../../../lib/videoConference/callHistory';

const createdBy = { _id: 'creator', username: 'creator.user', name: 'Creator User' };

const buildMember = (overrides: Partial<IVideoConferenceUser> & Pick<IVideoConferenceUser, '_id'>): IVideoConferenceUser => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	avatarETag: null,
	ts: new Date('2026-01-01T00:00:00.000Z'),
	...overrides,
});

const buildCall = (
	users: IVideoConferenceUser[],
	overrides: Partial<Pick<IGroupVideoConference, 'title' | 'rid' | '_id' | 'createdAt'>> = {},
): Pick<IGroupVideoConference, '_id' | 'rid' | 'title' | 'createdAt' | 'createdBy' | 'users'> => ({
	_id: 'call1',
	rid: 'room1',
	title: 'Sprint planning',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	createdBy,
	users,
	...overrides,
});

describe('buildConferenceCallHistoryItems', () => {
	it('should return no items for a conference with no members', () => {
		expect(buildConferenceCallHistoryItems(buildCall([]), { ended: true })).to.have.length(0);
	});

	it('should mark the creator outbound and every other member inbound', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true }), buildMember({ _id: 'other', joined: true })]);

		const items = buildConferenceCallHistoryItems(call, { ended: true });

		expect(items.find((item) => item.uid === 'creator')).to.have.property('direction', 'outbound');
		expect(items.find((item) => item.uid === 'other')).to.have.property('direction', 'inbound');
	});

	it('should mark a member who declined and never joined as not-answered', () => {
		const call = buildCall([buildMember({ _id: 'decliner', joined: false, declined: true, declinedAt: new Date() })]);

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.have.property('state', 'not-answered');
	});

	it('should mark a member who joined as ended, even if they declined earlier', () => {
		const call = buildCall([
			buildMember({ _id: 'changedMind', joined: true, joinedAt: new Date(), declined: true, declinedAt: new Date() }),
		]);

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.have.property('state', 'ended');
	});

	// Being added rings you, so ignoring it is a missed call just as much as declining is.
	it('should mark a member who was added but never joined as not-answered', () => {
		const call = buildCall([buildMember({ _id: 'ignoredInvite', joined: false })]);

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.have.property('state', 'not-answered');
	});

	// Entries written before the `joined` flag existed have it absent, which `hasJoinedVideoConference` reads
	// as joined — so a historical conference must not retroactively report its members as having missed it.
	it('should treat a member with no joined flag as having joined', () => {
		const call = buildCall([buildMember({ _id: 'legacyMember', declined: true, declinedAt: new Date() })]);

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.have.property('state', 'ended');
	});

	it('should count only members who joined, not every member', () => {
		const call = buildCall([
			buildMember({ _id: 'joinedOne', joined: true }),
			buildMember({ _id: 'joinedTwo', joined: true }),
			buildMember({ _id: 'neverJoined', joined: false }),
		]);

		const items = buildConferenceCallHistoryItems(call, { ended: true });

		expect(items.every((item) => item.usersCount === 2)).to.be.true;
	});

	it('should carry the conference room, call id and title over to every item', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { title: 'Weekly sync', rid: 'roomX', _id: 'callX' });

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.include({ rid: 'roomX', callId: 'callX', title: 'Weekly sync', type: 'video-conference' });
	});

	it('should omit the title when the conference has none', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { title: '' });

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item).to.not.have.property('title');
	});

	it('should stamp every item with the conference start time', () => {
		const startedAt = new Date('2026-02-15T10:00:00.000Z');
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { createdAt: startedAt });

		const [item] = buildConferenceCallHistoryItems(call, { ended: true });

		expect(item.ts).to.equal(startedAt);
	});
});

// While a conference runs, every member's row says the same thing — it is happening — and only its ending gives
// each of them an outcome of their own.
describe('a conference that is still running', () => {
	it('is ongoing for everyone in it', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true }), buildMember({ _id: 'other', joined: true })]);

		const items = buildConferenceCallHistoryItems(call, { ended: false });

		expect(items.every((item) => item.state === 'ongoing')).to.be.true;
	});

	// Someone who was rung and hasn't answered is not a missed call yet — the call is still there to answer, and
	// this row is how they reach it.
	it('is ongoing for a member who has not joined either', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true }), buildMember({ _id: 'ringing', joined: false })]);

		const items = buildConferenceCallHistoryItems(call, { ended: false });

		expect(items.find((item) => item.uid === 'ringing')).to.have.property('state', 'ongoing');
	});

	it('still says who started it', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true }), buildMember({ _id: 'other', joined: false })]);

		const items = buildConferenceCallHistoryItems(call, { ended: false });

		expect(items.find((item) => item.uid === 'creator')).to.have.property('direction', 'outbound');
		expect(items.find((item) => item.uid === 'other')).to.have.property('direction', 'inbound');
	});
});

describe('isLoggableConference', () => {
	it('logs a group conference', () => {
		expect(isLoggableConference({ type: 'videoconference', title: 'standup' } as any)).to.be.true;
	});

	// A 1:1 video call is the most call-shaped thing there is; leaving it out was what kept every DM call out
	// of the call log.
	it('logs a direct call, which is what a DM conference is', () => {
		expect(isLoggableConference({ type: 'direct' } as any)).to.be.true;
	});

	// The write is an upsert keyed by member and call, so a conference that already stopped can be written again
	// without doubling anyone's history — which is what makes the repeated end signals harmless.
	it('logs a conference that already stopped, because the write cannot duplicate', () => {
		expect(isLoggableConference({ type: 'videoconference', endedAt: new Date() } as any)).to.be.true;
	});

	// A livechat call is the visitor's, not a user's own log; a VoIP conference is already logged as a media
	// call, so logging it here would show it twice.
	it('refuses conference types that do not belong in a user call log', () => {
		expect(isLoggableConference({ type: 'livechat' } as any)).to.be.false;
		expect(isLoggableConference({ type: 'voip' } as any)).to.be.false;
	});
});

describe('hasActiveParticipants', () => {
	it('counts a member who joined and has not left', () => {
		expect(hasActiveParticipants([{ joined: true }])).to.be.true;
	});

	// This is what decides a conference is over, so a member who joined and left must not hold it open.
	it('does not count a member who left', () => {
		expect(hasActiveParticipants([{ joined: true, leftAt: new Date() }])).to.be.false;
	});

	it('does not count a member who never joined, so an unanswered ring cannot hold a call open', () => {
		expect(hasActiveParticipants([{ joined: false }])).to.be.false;
	});

	it('treats an entry predating the flag as still in the call', () => {
		expect(hasActiveParticipants([{}])).to.be.true;
	});

	it('holds the call open while anyone at all remains', () => {
		expect(hasActiveParticipants([{ joined: true, leftAt: new Date() }, { joined: true }])).to.be.true;
	});

	it('is false for a call nobody ever joined', () => {
		expect(hasActiveParticipants([])).to.be.false;
	});
});
