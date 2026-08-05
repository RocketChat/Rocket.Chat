import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { buildGroupCall, buildMember, commonServiceStubs } from './testHarness';

let call: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => call),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().resolves(),
	setDataById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	setUserLeftById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const CallHistoryMock = {
	upsertMany: sinon.stub().resolves(),
};

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/models': {
		VideoConference: VideoConferenceModelMock,
		CallHistory: CallHistoryMock,
		Users: {
			findOneById: sinon.stub().callsFake(async (uid: string) => ({ _id: uid, username: uid, name: uid, avatarETag: null })),
			find: sinon.stub().returns({ toArray: async () => [] }),
		},
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'room1', t: 'p' }) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: { findOneByRoomIdAndUserId: sinon.stub().resolves(null) },
	},
	'@rocket.chat/core-services': {
		api: { broadcast: sinon.stub().resolves() },
		ServiceClassInternal: class {
			onEvent() {
				/* no-op */
			}
		},
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Room: { addUserToRoom: sinon.stub().resolves() },
	},
});

/** What the last write said about each member. */
const lastWrite = () => CallHistoryMock.upsertMany.lastCall.args[0] as { uid: string; state: string; usersCount: number }[];

describe('VideoConfService: a conference in its members history', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		[VideoConferenceModelMock.findOneById, VideoConferenceModelMock.setUserJoinedById, CallHistoryMock.upsertMany].forEach((stub) =>
			stub.resetHistory(),
		);
		call = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'invited', joined: false, joinedAt: undefined })]);
	});

	// The whole point of logging a call from the start: the history is the one list of calls, and a call in
	// progress belongs in it — which is also what gives someone who declined a way back into it.
	it('records everyone as ongoing when someone joins', async () => {
		await service.addUser('call1', 'invited');

		expect(CallHistoryMock.upsertMany.called).to.be.true;
		expect(lastWrite().every(({ state }) => state === 'ongoing')).to.be.true;
	});

	it('gives the member who joined a row of their own', async () => {
		await service.addUser('call1', 'invited');

		expect(lastWrite().map(({ uid }) => uid)).to.include('invited');
	});

	// Each member's own outcome only exists once the call is over: who was there, and who never answered.
	it('settles each member state when the call ends', async () => {
		await service.endCall('call1');

		const written = lastWrite();
		expect(written.find(({ uid }) => uid === 'creator')).to.include({ state: 'ended' });
		expect(written.find(({ uid }) => uid === 'invited')).to.include({ state: 'not-answered' });
	});

	it('records how many were in it, not how many were asked', async () => {
		await service.endCall('call1');

		expect(lastWrite().every(({ usersCount }) => usersCount === 1)).to.be.true;
	});

	// A livechat call belongs to a visitor rather than to a user's own log, and a VoIP conference is already
	// logged as a media call.
	it('logs nothing for a conference that does not belong in a user call log', async () => {
		call = { ...buildGroupCall([buildMember({ _id: 'creator' })]), type: 'livechat' } as unknown as VideoConference;

		await service.endCall('call1');

		expect(CallHistoryMock.upsertMany.called).to.be.false;
	});
});
