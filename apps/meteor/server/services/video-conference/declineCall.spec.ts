import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus, isInVideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, createService, resetAll } from './testHarness';

// Mirrors `ringing.spec.ts`'s approach: `fixture` is the single canonical record and
// `VideoConference.findOneById` hands out a clone of it on every call, regardless of projection.
let fixture: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	// Mirrors the model: an entry is pushed as *not* present, whatever the caller passed. Getting this wrong
	// would leave fixture members with no `joined` flag at all, which every reader treats as joined.
	addMemberById: sinon.stub().callsFake(async (_callId: string, member: IVideoConferenceUser) => {
		fixture.users.push({ ...member, joined: false });
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

// `declineCall` reads `Users.findOneById` only for someone with no existing `users[]` entry (a room member
// rung who never had a membership entry created for them).
const UsersMock = {
	findOneById: sinon.stub().resolves({ _id: 'roomMember', username: 'roomMember.user', name: 'Room Member' }),
};

const broadcastStub = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast: broadcastStub,
	models: { Users: UsersMock, VideoConference: VideoConferenceModelMock },
});

// The one broadcast `declineCall` sends besides the room update: `video-conference.updated`, which is what tells
// an open call window to re-read the conference — and so its membership.
const conferenceUpdatedCalls = (): { callId: string }[] =>
	broadcastStub.args.filter(([channel]) => channel === 'video-conference.updated').map(([, payload]) => payload as { callId: string });

describe('VideoConfService.declineCall', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.addMemberById,
			VideoConferenceModelMock.setUserDeclinedById,
			VideoConferenceModelMock.setDataById,
			VideoConferenceModelMock.setStatusById,
			UsersMock.findOneById,
			broadcastStub,
		);
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture(fixture));
		VideoConferenceModelMock.addMemberById.callsFake(async (_callId: string, member: IVideoConferenceUser) => {
			fixture.users.push({ ...member, joined: false });
		});
		VideoConferenceModelMock.setUserDeclinedById.callsFake(async (_callId: string, uid: string) => {
			const member = fixture.users.find((user) => user._id === uid);
			if (member) {
				(member as IVideoConferenceUser).declined = true;
			}
		});
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
	});

	// A user rung as a room member (never added to `users[]`) has no membership entry — one must be created so
	// there is somewhere to record the decline.
	it('creates an entry for someone who has none, without marking them present', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		UsersMock.findOneById.resolves({ _id: 'roomMember', username: 'roomMember.user', name: 'Room Member' });

		await service.declineCall('roomMember', 'call1');

		expect(VideoConferenceModelMock.addMemberById.calledOnce).to.be.true;
		const [callId, member] = VideoConferenceModelMock.addMemberById.firstCall.args;
		expect(callId).to.equal('call1');
		expect(member).to.include({ _id: 'roomMember' });

		// Turning a call down is not being in it.
		const created = fixture.users.find(({ _id }) => _id === 'roomMember');
		expect(created && isInVideoConference(created)).to.be.false;

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
	it('announces the change with an updated broadcast', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'decliner', joined: false, joinedAt: undefined })]);

		await service.declineCall('decliner', 'call1');

		const updates = conferenceUpdatedCalls();
		expect(updates).to.have.length(1);
		expect(updates[0]).to.deep.equal({ callId: 'call1' });
	});
});
