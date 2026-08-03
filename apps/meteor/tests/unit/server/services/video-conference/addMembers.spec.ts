import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { commonServiceStubs, buildMember, buildGroupCall } from './testHarness';

// Mirrors `ringMembers.spec.ts`'s approach: `fixture` is the single canonical record and
// `VideoConference.findOneById` hands out a clone of it on every call, regardless of projection.
let fixture: VideoConference;

const cloneFixture = (): VideoConference => ({
	...fixture,
	users: fixture.users.map((user) => ({ ...user })),
	messages: { ...fixture.messages },
});

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture()),
	setUsersRingingById: sinon.stub().callsFake(async (_callId: string, uids: string[], ringingAt: Date) => {
		fixture.users.forEach((user) => {
			if (uids.includes(user._id)) {
				(user as IVideoConferenceUser).ringingAt = ringingAt;
			}
		});
	}),
	addMemberById: sinon.stub().callsFake(async (_callId: string, member: IVideoConferenceUser) => {
		fixture.users.push({ ...member });
	}),
};

// `Users.find` is how `addMembers` resolves the usernames it was asked to add; `Users.findOneById` is how
// `notifyUsersAddedToConference` reads the adder's display name. Both need to resolve to something
// user-shaped or the call under test would throw before reaching the assertions.
const UsersMock = {
	findOneById: sinon.stub().resolves({ _id: 'adder', username: 'adder.user', name: 'Adder User' }),
	find: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }),
};

const broadcastStub = sinon.stub().resolves();

// Deliberately NOT stubbing '../../../lib/videoConference/constants' — `shouldRingVideoConference`'s
// ringing-limit guard (capped at `VIDEO_CONF_RINGING_LIMIT` = 10) is exactly what one of the tests below
// is exercising, so it has to be the real implementation.
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
		CallHistory: { insertMany: sinon.stub().resolves({ insertedCount: 0 }) },
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		Rooms: { findOneById: sinon.stub().resolves(null) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: {
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
		},
	},
});

// Filters the broadcast stub down to the `ring` notifications `notifyUser` sends via
// `api.broadcast('user.video-conference', { userId, action, params })` — the only observable trace of who
// actually got rung.
const ringedUserIds = (): string[] =>
	broadcastStub.args
		.filter(([channel, payload]) => channel === 'user.video-conference' && (payload as { action: string }).action === 'ring')
		.map(([, payload]) => (payload as { userId: string }).userId);

// `notifyUsersAddedToConference` broadcasts one `notify.desktop` call per added member, via
// `api.broadcast('notify.desktop', memberId, notification)` — a 3-arg call, unlike the 2-arg ring broadcast
// above. `audioNotificationValue`/room identity live under the notification's own nested `payload` property.
const desktopNotifications = (): { memberId: string; payload: Record<string, unknown> }[] =>
	broadcastStub.args
		.filter(([channel]) => channel === 'notify.desktop')
		.map(([, memberId, notification]) => ({
			memberId: memberId as string,
			payload: (notification as { payload: Record<string, unknown> }).payload,
		}));

const buildUser = (id: string) => ({ _id: id, username: `${id}.user`, name: id, avatarETag: null });

describe('VideoConfService.addMembers', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		// Bare `sinon.stub()`s live outside sinon's default sandbox, so `sinon.resetHistory()` is a no-op for
		// them — each has to be reset by hand or a test would silently read the previous test's calls.
		[
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.addMemberById,
			UsersMock.findOneById,
			UsersMock.find,
			broadcastStub,
		].forEach((stub) => stub.resetHistory());
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture());
		VideoConferenceModelMock.addMemberById.callsFake(async (_callId: string, member: IVideoConferenceUser) => {
			fixture.users.push({ ...member });
		});
		UsersMock.findOneById.resolves({ _id: 'adder', username: 'adder.user', name: 'Adder User' });
		UsersMock.find.returns({ toArray: sinon.stub().resolves([]) });
		broadcastStub.resolves();
	});

	it('registers each named user as a member with joined: false, and returns the ids added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1'), buildUser('newUser2')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });

		const result = await service.addMembers('caller', 'call1', ['newUser1.user', 'newUser2.user']);

		expect(result.sort()).to.deep.equal(['newUser1', 'newUser2']);
		expect(VideoConferenceModelMock.addMemberById.callCount).to.equal(2);
		VideoConferenceModelMock.addMemberById.args.forEach(([callId, member]) => {
			expect(callId).to.equal('call1');
			expect(member).to.include({ joined: false });
		});
		expect(VideoConferenceModelMock.addMemberById.args.map(([, member]) => member._id).sort()).to.deep.equal(['newUser1', 'newUser2']);
	});

	// Overwriting an existing entry would wipe out whatever `joinedAt`/`declined` state the member already
	// has — this is the guard that stops an add from clobbering a member who is already present.
	it('skips a user who already has a users[] entry, leaving their existing state untouched', async () => {
		const existingJoinedAt = new Date('2026-01-01T00:10:00.000Z');
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'already', joined: true, joinedAt: existingJoinedAt, declined: true }),
		]);
		UsersMock.find.returns({ toArray: sinon.stub().resolves([buildUser('already')]) });

		const result = await service.addMembers('caller', 'call1', ['already.user']);

		expect(result).to.deep.equal([]);
		expect(VideoConferenceModelMock.addMemberById.called).to.be.false;

		const existing = fixture.users.filter((user) => user._id === 'already');
		expect(existing).to.have.length(1);
		expect(existing[0].joinedAt).to.equal(existingJoinedAt);
		expect(existing[0].declined).to.be.true;
	});

	it('rings everyone actually added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1'), buildUser('newUser2')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });

		const result = await service.addMembers('caller', 'call1', ['newUser1.user', 'newUser2.user']);

		expect(result.sort()).to.deep.equal(['newUser1', 'newUser2']);
		expect(ringedUserIds().sort()).to.deep.equal(['newUser1', 'newUser2']);
	});

	// Nobody was actually added (every requested user was already a member) — there is nobody new to ring.
	it('rings nobody when nobody was added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'already' })]);
		UsersMock.find.returns({ toArray: sinon.stub().resolves([buildUser('already')]) });

		const result = await service.addMembers('caller', 'call1', ['already.user']);

		expect(result).to.deep.equal([]);
		expect(ringedUserIds()).to.deep.equal([]);
	});

	// `shouldRingVideoConference` caps a ring at `VIDEO_CONF_RINGING_LIMIT` (10) — this is the real function,
	// not a stub, so adding 11 users must trip the cap and suppress the ring entirely, even though every one
	// of them was genuinely added.
	it('respects the ringing cap: adding 11 users rings nobody', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = Array.from({ length: 11 }, (_, index) => buildUser(`newUser${index}`));
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });

		const result = await service.addMembers(
			'caller',
			'call1',
			newUsers.map((user) => user.username),
		);

		expect(result).to.have.length(11);
		expect(ringedUserIds()).to.deep.equal([]);
	});

	// A call must not announce itself with the new-message sound (`audioNotificationValue: 'none'`), and its
	// click must not try to open a room the member may not be able to see (no `payload.name`).
	it('sends a silent desktop notification with no room name for each added member', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });
		UsersMock.findOneById.resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' });

		await service.addMembers('caller', 'call1', ['newUser1.user']);

		const notifications = desktopNotifications();
		expect(notifications).to.have.length(1);
		expect(notifications[0].memberId).to.equal('newUser1');
		expect(notifications[0].payload).to.include({ audioNotificationValue: 'none' });
		expect(notifications[0].payload).to.not.have.property('name');
	});
});
