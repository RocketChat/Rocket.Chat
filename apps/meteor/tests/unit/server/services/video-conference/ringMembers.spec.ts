import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { commonServiceStubs, buildMember, buildGroupCall } from './testHarness';

// Mirrors `leaveCall.spec.ts`'s approach: `fixture` is the single canonical record and
// `VideoConference.findOneById` hands out a clone of it on every call, regardless of projection.
let fixture: VideoConference;

const cloneFixture = (): VideoConference => ({
	...fixture,
	users: fixture.users.map((user) => ({ ...user })),
	messages: { ...fixture.messages },
});

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture()),
};

// `notifyUsersAddedToConference` reads the adder and the rung members straight off `Users` and broadcasts a
// desktop notification for each — it must not throw for that to happen, so both calls need to resolve
// something shaped like a real user.
const UsersMock = {
	findOneById: sinon.stub().resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' }),
	find: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }),
};

const CallHistoryMock = { insertMany: sinon.stub().resolves({ insertedCount: 0 }) };
const RoomsMock = { findOneById: sinon.stub().resolves(null) };
const MessagesMock = { setBlocksById: sinon.stub().resolves() };
const SubscriptionsMock = {
	findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
};

const broadcastStub = sinon.stub().resolves();

// Deliberately NOT stubbing '../../../lib/videoConference/constants' — `ringMembers`'s ringing-limit guard
// (`shouldRingVideoConference`, capped at `VIDEO_CONF_RINGING_LIMIT` = 10) is exactly what one of the tests
// below is exercising, so it has to be the real implementation.
const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/core-services': {
		api: { broadcast: broadcastStub },
		ServiceClassInternal: class {
			onEvent() {
				/* no-op */
			}
		},
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Room: { addUserToRoom: sinon.stub().resolves() },
	},
	'@rocket.chat/models': {
		CallHistory: CallHistoryMock,
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		Rooms: RoomsMock,
		Messages: MessagesMock,
		Subscriptions: SubscriptionsMock,
	},
});

// Filters the broadcast stub down to the `ring` notifications `notifyUser` sends via
// `api.broadcast('user.video-conference', { userId, action, params })` — the only observable trace of who
// actually got rung.
const ringedUserIds = (): string[] =>
	broadcastStub.args
		.filter(([channel, payload]) => channel === 'user.video-conference' && (payload as { action: string }).action === 'ring')
		.map(([, payload]) => (payload as { userId: string }).userId);

describe('VideoConfService.ringMembers', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		// Bare `sinon.stub()`s live outside sinon's default sandbox, so `sinon.resetHistory()` is a no-op for
		// them — each has to be reset by hand or a test would silently read the previous test's calls.
		[VideoConferenceModelMock.findOneById, UsersMock.findOneById, UsersMock.find, broadcastStub].forEach((stub) => stub.resetHistory());
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture());
		UsersMock.findOneById.resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' });
		UsersMock.find.returns({ toArray: sinon.stub().resolves([]) });
		broadcastStub.resolves();
	});

	// The base case: a member added to the call but who never answered has no active presence, so a second
	// ring is the only way to reach them.
	it('rings members who were never in the call, and nobody else', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'neverJoined1', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'neverJoined2', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result.sort()).to.deep.equal(['neverJoined1', 'neverJoined2']);
		expect(ringedUserIds().sort()).to.deep.equal(['neverJoined1', 'neverJoined2']);
	});

	// "Call them back" is exactly this shape: they were on the call and aren't anymore. `isInVideoConference`
	// says `joined: true` with a `leftAt` is not currently present, so they must be rung the same as anyone
	// who never picked up.
	it('rings a member who joined the call and then left it', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'wentQuiet', joined: true, leftAt: new Date('2026-01-01T00:15:00.000Z') }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal(['wentQuiet']);
		expect(ringedUserIds()).to.deep.equal(['wentQuiet']);
	});

	// Someone already on the call has no reason to be interrupted by a ring meant for people who aren't there.
	it('does not ring a member who is currently in the call', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'stillHere', joined: true }),
			buildMember({ _id: 'absent', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal(['absent']);
		expect(ringedUserIds()).to.not.include('stillHere');
	});

	// The caller is the one asking for the retry, not a target of it — this has to hold even for a caller
	// entry that would otherwise read as absent (e.g. written with `joined: false`), since nothing else in
	// `ringMembers` special-cases the caller's own membership shape.
	it('never rings the caller themselves, even if their own entry looks absent', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'absent', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.not.include('caller');
		expect(ringedUserIds()).to.not.include('caller');
	});

	// Nobody absent means nothing to do — this is also what a call with a full house looks like after
	// everyone's already answered.
	it('returns an empty array when nobody is absent', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'other', joined: true })]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds()).to.deep.equal([]);
	});

	// A conference that already ended is not something you can still ring people into — `ringMembers` must
	// bail out before even looking at who's absent.
	it('returns an empty array and rings nobody for a conference that has already ended', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'absent', joined: false, joinedAt: undefined })], {
			endedAt: new Date('2026-01-01T01:00:00.000Z'),
		});

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds()).to.deep.equal([]);
	});

	// `shouldRingVideoConference` caps a ring at `VIDEO_CONF_RINGING_LIMIT` (10) — this is the real function,
	// not a stub, so 11 absent members must trip the cap and suppress the ring entirely rather than partially
	// ringing 10 of them.
	it('rings nobody when the number of absent members exceeds the ringing limit', async () => {
		const absentMembers: IVideoConferenceUser[] = Array.from({ length: 11 }, (_, index) =>
			buildMember({ _id: `absent${index}`, joined: false, joinedAt: undefined }),
		);
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), ...absentMembers]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds()).to.deep.equal([]);
	});
});
