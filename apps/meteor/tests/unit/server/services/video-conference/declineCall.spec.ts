import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
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
	addMemberById: sinon.stub().callsFake(async (_callId: string, member: IVideoConferenceUser) => {
		fixture.users.push({ ...member });
	}),
	setUserDeclinedById: sinon.stub().callsFake(async (_callId: string, uid: string) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).declined = true;
		}
	}),
	setDataById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
};

const CallHistoryMock = { insertMany: sinon.stub().resolves({ insertedCount: 0 }) };

// `declineCall` reads `Users.findOneById` only for someone with no existing `users[]` entry (a room member
// rung who never had a membership entry created for them).
const UsersMock = {
	findOneById: sinon.stub().resolves({ _id: 'roomMember', username: 'roomMember.user', name: 'Room Member' }),
};

const broadcastStub = sinon.stub().resolves();

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
		Rooms: { findOneById: sinon.stub().resolves(null) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: {
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
		},
	},
});

// The one broadcast `declineCall` sends besides the room update: `video-conference.membersUpdated`, which is
// what tells an open call window to re-read the conference's membership.
const membersUpdatedCalls = (): { callId: string }[] =>
	broadcastStub.args
		.filter(([channel]) => channel === 'video-conference.membersUpdated')
		.map(([, payload]) => payload as { callId: string });

describe('VideoConfService.declineCall', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		// Bare `sinon.stub()`s live outside sinon's default sandbox, so `sinon.resetHistory()` is a no-op for
		// them — each has to be reset by hand or a test would silently read the previous test's calls.
		[
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.addMemberById,
			VideoConferenceModelMock.setUserDeclinedById,
			VideoConferenceModelMock.setDataById,
			VideoConferenceModelMock.setStatusById,
			CallHistoryMock.insertMany,
			UsersMock.findOneById,
			broadcastStub,
		].forEach((stub) => stub.resetHistory());
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture());
		VideoConferenceModelMock.addMemberById.callsFake(async (_callId: string, member: IVideoConferenceUser) => {
			fixture.users.push({ ...member });
		});
		VideoConferenceModelMock.setUserDeclinedById.callsFake(async (_callId: string, uid: string) => {
			const member = fixture.users.find((user) => user._id === uid);
			if (member) {
				(member as IVideoConferenceUser).declined = true;
			}
		});
		CallHistoryMock.insertMany.resolves({ insertedCount: 0 });
		UsersMock.findOneById.resolves({ _id: 'roomMember', username: 'roomMember.user', name: 'Room Member' });
		broadcastStub.resolves();
	});

	it("records the decline on the caller's own entry", async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'decliner', joined: false, joinedAt: undefined })]);

		await service.declineCall('decliner', 'call1');

		expect(VideoConferenceModelMock.setUserDeclinedById.calledOnceWith('call1', 'decliner')).to.be.true;
		const decliner = fixture.users.find((user) => user._id === 'decliner');
		expect(decliner?.declined).to.be.true;
	});

	// This is what separates declining a conference from rejecting a 1:1 call — a decline must never end the
	// conference or write call history.
	it('never ends the conference: no endedAt/status write, no call-history insert', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'decliner', joined: false, joinedAt: undefined })]);

		await service.declineCall('decliner', 'call1');

		expect(fixture.endedAt).to.be.undefined;
		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		expect(VideoConferenceModelMock.setDataById.called).to.be.false;
		expect(VideoConferenceModelMock.setStatusById.called).to.be.false;
		expect(CallHistoryMock.insertMany.called).to.be.false;
	});

	// A user rung as a room member (never added to `users[]`) has no membership entry — one must be created so
	// there is somewhere to record the decline.
	it('creates an entry for someone who has none, added with joined: false', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		UsersMock.findOneById.resolves({ _id: 'roomMember', username: 'roomMember.user', name: 'Room Member' });

		await service.declineCall('roomMember', 'call1');

		expect(VideoConferenceModelMock.addMemberById.calledOnce).to.be.true;
		const [callId, member] = VideoConferenceModelMock.addMemberById.firstCall.args;
		expect(callId).to.equal('call1');
		expect(member).to.include({ _id: 'roomMember', joined: false });

		expect(VideoConferenceModelMock.setUserDeclinedById.calledOnceWith('call1', 'roomMember')).to.be.true;
	});

	// A member who declines can still join afterwards — the existing entry's `joined` flag must be left alone,
	// only `declined` changes.
	it("leaves an existing entry's joined flag alone", async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'decliner', joined: false, joinedAt: undefined })]);

		await service.declineCall('decliner', 'call1');

		expect(VideoConferenceModelMock.addMemberById.called).to.be.false;
		const decliner = fixture.users.find((user) => user._id === 'decliner');
		expect(decliner?.joined).to.equal(false);
		expect(decliner?.declined).to.be.true;
	});

	// Open call windows re-read the conference's membership off this broadcast.
	it('announces the change with a membersUpdated broadcast', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'decliner', joined: false, joinedAt: undefined })]);

		await service.declineCall('decliner', 'call1');

		const updates = membersUpdatedCalls();
		expect(updates).to.have.length(1);
		expect(updates[0]).to.deep.equal({ callId: 'call1' });
	});
});
