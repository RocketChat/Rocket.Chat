import type { IRoom, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, createService, resetAll } from './testHarness';

// `getChatAccess` reads the conference once, then decides per room whether it can answer from a single
// `Subscriptions` read or has to fall back to asking `canAccessRoomIdAsync` once per member — so each test
// configures a `fixture` (the conference) and a `room` (returned by `Rooms.findOneById`), and asserts both the
// resulting `membersWithoutAccess`/`canInvite` and which of the two access paths actually ran.
let fixture: VideoConference;
let room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'teamId' | 'prid' | 'abacAttributes'>;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
};

const RoomsMock = {
	findOneById: sinon.stub().callsFake(async () => ({ ...room })),
};

const canAccessRoomIdAsyncStub = sinon.stub();

const findByRoomIdAndUserIdsStub = sinon.stub();
const SubscriptionsMock = {
	findByRoomIdAndUserIds: findByRoomIdAndUserIdsStub,
};

// `canInvite` comes from the room directives, not from access itself — a DM can't take new members, anything
// else can, which is enough to tell the two apart without pulling in the real `roomCoordinator`.
const allowMemberActionStub = sinon.stub().callsFake(async (targetRoom: Pick<IRoom, 't'>) => targetRoom.t !== 'd');

// The two room-access paths and the invite rule are what this suite is about, so those come from the spec
// rather than from the harness's inert defaults.
const VideoConfService = createService({
	models: {
		VideoConference: VideoConferenceModelMock,
		Rooms: RoomsMock,
		Subscriptions: SubscriptionsMock,
	},
	overrides: {
		'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync: canAccessRoomIdAsyncStub },
		'../../lib/rooms/roomCoordinator': {
			roomCoordinator: { getRoomDirectives: () => ({ allowMemberAction: allowMemberActionStub, getDiscussionType: () => 'p' }) },
		},
	},
});

describe('VideoConfService.getChatAccess', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(
			VideoConferenceModelMock.findOneById,
			RoomsMock.findOneById,
			canAccessRoomIdAsyncStub,
			findByRoomIdAndUserIdsStub,
			allowMemberActionStub,
		);
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture(fixture));
		RoomsMock.findOneById.callsFake(async () => ({ ...room }));
		canAccessRoomIdAsyncStub.reset();
		findByRoomIdAndUserIdsStub.reset();
		findByRoomIdAndUserIdsStub.returns({ toArray: sinon.stub().resolves([]) });
		allowMemberActionStub.callsFake(async (targetRoom: Pick<IRoom, 't'>) => targetRoom.t !== 'd');
	});

	// A plain public channel (no team) is readable by anyone — the whole point of the fast path is that this
	// case costs one `Subscriptions` read (to catch a ban), never a per-member authorization call.
	it('treats every member of a public channel as having access, except one explicitly banned', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'alice' }), buildMember({ _id: 'bob' }), buildMember({ _id: 'banned' })]);
		room = { _id: 'room1', t: 'c', name: 'general', fname: 'general' };
		findByRoomIdAndUserIdsStub.returns({
			toArray: sinon.stub().resolves([{ u: { _id: 'banned' }, status: 'BANNED' }]),
		});

		const result = await service.getChatAccess('caller', 'call1');

		expect(result.membersWithoutAccess).to.deep.equal(['banned']);
		expect(result.type).to.equal('c');
		expect(canAccessRoomIdAsyncStub.called).to.be.false;
		expect(findByRoomIdAndUserIdsStub.calledOnce).to.be.true;
		expect(findByRoomIdAndUserIdsStub.firstCall.args[0]).to.equal('room1');
		expect(findByRoomIdAndUserIdsStub.firstCall.args[1].sort()).to.deep.equal(['alice', 'banned', 'bob']);
		expect(result.canInvite).to.be.true;
	});

	// A public channel that belongs to a private team can be read through team membership alone, with no
	// subscription to this specific channel — a case a `Subscriptions`-only read can't see. This has to keep
	// asking the real per-member check rather than guessing from this room's own subscriptions.
	it('falls back to asking per member for a public channel that belongs to a team', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'teamMember' }), buildMember({ _id: 'outsider' })]);
		room = { _id: 'room1', t: 'c', name: 'team-channel', fname: 'team-channel', teamId: 'team1' };
		canAccessRoomIdAsyncStub.callsFake(async (_rid: string, uid: string) => uid === 'teamMember');

		const result = await service.getChatAccess('caller', 'call1');

		expect(result.membersWithoutAccess).to.deep.equal(['outsider']);
		expect(canAccessRoomIdAsyncStub.callCount).to.equal(2);
		expect(canAccessRoomIdAsyncStub.args.map(([, uid]) => uid).sort()).to.deep.equal(['outsider', 'teamMember']);
		expect(findByRoomIdAndUserIdsStub.called).to.be.false;
	});

	// A private group only grants access to its subscribers — this is the other shape the fast path covers,
	// one `Subscriptions` read standing in for what would otherwise be a `canAccessRoomIdAsync` call each.
	it('treats only subscribed members of a private group as having access', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'member' }), buildMember({ _id: 'invited' }), buildMember({ _id: 'stranger' })]);
		room = { _id: 'room1', t: 'p', name: 'private-group', fname: 'private-group' };
		findByRoomIdAndUserIdsStub.returns({
			toArray: sinon.stub().resolves([
				{ u: { _id: 'member' }, status: undefined },
				{ u: { _id: 'invited' }, status: 'INVITED' },
			]),
		});

		const result = await service.getChatAccess('caller', 'call1');

		expect(result.membersWithoutAccess.sort()).to.deep.equal(['invited', 'stranger']);
		expect(canAccessRoomIdAsyncStub.called).to.be.false;
		expect(findByRoomIdAndUserIdsStub.calledOnce).to.be.true;
		expect(result.canInvite).to.be.true;
	});

	// A DM behaves like any other private room for access — subscription required — but can't take new
	// members, which is what `canInvite` reports back.
	it('treats only subscribed members of a DM as having access, and reports it as not invitable', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'member' }), buildMember({ _id: 'neverJoinedRoom' })]);
		room = { _id: 'room1', t: 'd', name: 'member.other', fname: '' };
		findByRoomIdAndUserIdsStub.returns({
			toArray: sinon.stub().resolves([{ u: { _id: 'member' }, status: undefined }]),
		});

		const result = await service.getChatAccess('caller', 'call1');

		// `neverJoinedRoom` is a conference member who was never in the room at all: no subscription document
		// exists for them, which must read the same as an explicitly denied one.
		expect(result.membersWithoutAccess).to.deep.equal(['neverJoinedRoom']);
		expect(result.canInvite).to.be.false;
	});
});
