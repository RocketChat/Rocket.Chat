import type { IDirectVideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { buildDirectCall, buildMember, commonServiceStubs } from './testHarness';

let call: IDirectVideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => call),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const notifications = sinon.stub().resolves();

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/models': {
		VideoConference: VideoConferenceModelMock,
		Users: {
			findOneById: sinon.stub().callsFake(async (uid: string) => ({ _id: uid, username: uid, name: uid, avatarETag: null })),
			find: sinon.stub().returns({ toArray: async () => [] }),
		},
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'room1', t: 'd' }) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: { findOneByRoomIdAndUserId: sinon.stub().resolves(null) },
		CallHistory: { insertMany: sinon.stub().resolves() },
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
	'../../lib/notifications/notifyUser': { notifyUser: notifications },
});

describe('VideoConfService: ringing a direct call when its caller arrives', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		[
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.setUsersRingingById,
			VideoConferenceModelMock.setUserJoinedById,
			notifications,
		].forEach((stub) => stub.resetHistory());
		call = buildDirectCall([
			buildMember({ _id: 'creator', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'callee', joined: false, joinedAt: undefined }),
		]);
	});

	// Creating the call is not asking anyone to answer it: the caller lands on the preflight first, and being rung
	// into a call whose caller is still choosing a camera means answering to an empty room.
	it('rings the callee when the caller joins', async () => {
		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.calledWith('call1', ['callee'])).to.be.true;
	});

	it('rings nobody when the callee is the one arriving', async () => {
		await service.addUser('call1', 'callee');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	// Rejoining must not ring anyone again — the call window's own "ring again" is how a second attempt is asked
	// for.
	it('does not ring someone who has already been rung', async () => {
		call = buildDirectCall([
			buildMember({ _id: 'creator', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'callee', joined: false, joinedAt: undefined, ringingAt: new Date('2026-01-01T00:00:00.000Z') }),
		]);

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	it('does not ring someone who already declined', async () => {
		call = buildDirectCall([
			buildMember({ _id: 'creator', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'callee', joined: false, joinedAt: undefined, declined: true }),
		]);

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	it('does not ring someone who is already in the call', async () => {
		call = buildDirectCall([buildMember({ _id: 'creator', joined: false, joinedAt: undefined }), buildMember({ _id: 'callee' })]);

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});
});
