import { afterEach, beforeEach, describe, it } from 'node:test';

import type { IRoom } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import {
	activeProviderStubs,
	buildGroupCall,
	buildLink,
	createService,
	duplicateKeyError,
	providerCapabilities,
	resetAll,
} from './testHarness';

const VideoConferenceModelMock = {
	createGroup: sinon.stub(),
	createDirect: sinon.stub(),
	findOneById: sinon.stub(),
	setMessageById: sinon.stub(),
	findOneActiveByConferenceRoomId: sinon.stub(),
};
const VideoConferenceRoomsMock = { findOneByUrl: sinon.stub() };
const RoomsMock = { findOneById: sinon.stub() };
const UsersMock = { findOneById: sinon.stub() };
const getTypeForRoom = sinon.stub();
const sendMessage = sinon.stub();
const broadcast = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast,
	models: {
		VideoConference: VideoConferenceModelMock,
		VideoConferenceRooms: VideoConferenceRoomsMock,
		Rooms: RoomsMock,
		Users: UsersMock,
	},
	overrides: {
		...activeProviderStubs,
		'../../lib/videoConfTypes': { videoConfTypes: { isCallManagedByApp: () => false, getTypeForRoom } },
		'../../lib/messages/sendMessage': { sendMessage },
	},
});

describe('VideoConfService.start from a link', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = { embedded: true };
		resetAll(broadcast);
		for (const stub of [
			...Object.values(VideoConferenceModelMock),
			VideoConferenceRoomsMock.findOneByUrl,
			RoomsMock.findOneById,
			UsersMock.findOneById,
			getTypeForRoom,
			sendMessage,
		]) {
			stub.reset();
		}
		VideoConferenceRoomsMock.findOneByUrl.resolves(buildLink());
		VideoConferenceModelMock.findOneActiveByConferenceRoomId.resolves(null);
		VideoConferenceModelMock.createGroup.resolves('call1');
		VideoConferenceModelMock.findOneById.callsFake(async () => buildGroupCall([]));
		RoomsMock.findOneById.resolves({ _id: 'room1', t: 'p', name: 'planning' });
		UsersMock.findOneById.resolves({ _id: 'creator', name: 'Creator User', username: 'creator.user' });
		getTypeForRoom.resolves({ type: 'videoconference' });
		sendMessage.resolves({ _id: 'msg1' });
	});

	afterEach(() => {
		providerCapabilities.current = undefined;
	});

	// Existing clients never send a link: what they start must not gain a key, not even an undefined one.
	it('without customUrl passes no link fields', async () => {
		const create = sinon.spy(service, 'create');

		await service.start('creator', 'room1', { title: 'Planning', allowRinging: false });

		for (const data of [create.firstCall.args[0], VideoConferenceModelMock.createGroup.firstCall.args[0]]) {
			expect(Object.keys(data)).to.not.include('conferenceRoomId');
			expect(Object.keys(data)).to.not.include('customUrl');
		}
		expect(VideoConferenceRoomsMock.findOneByUrl.called).to.be.false;
	});

	it("starts with the link's title and fields", async () => {
		const result = await service.start('creator', 'room1', { title: 'Ignored', allowRinging: false, customUrl: 'weekly-sync' });

		expect(VideoConferenceRoomsMock.findOneByUrl.calledOnceWith('weekly-sync')).to.be.true;
		expect(VideoConferenceModelMock.createGroup.firstCall.args[0]).to.include({
			rid: 'room1',
			title: 'Weekly sync',
			conferenceRoomId: 'link1',
			customUrl: 'weekly-sync',
		});
		expect(sendMessage.calledOnce).to.be.true;
		expect(result).to.deep.equal({ type: 'videoconference', callId: 'call1', rid: 'room1' });
	});

	it('refuses an unknown link', async () => {
		VideoConferenceRoomsMock.findOneByUrl.resolves(null);

		await expect(service.start('creator', 'room1', { customUrl: 'nowhere' })).to.be.rejectedWith('error-invalid-conference-room');
		expect(VideoConferenceModelMock.createGroup.called).to.be.false;
	});

	it('refuses a link of another room', async () => {
		VideoConferenceRoomsMock.findOneByUrl.resolves(buildLink({ rid: 'other-room' }));

		await expect(service.start('creator', 'room1', { customUrl: 'weekly-sync' })).to.be.rejectedWith('error-invalid-conference-room');
		expect(VideoConferenceModelMock.createGroup.called).to.be.false;
	});

	it('returns the live conference as is', async () => {
		VideoConferenceModelMock.findOneActiveByConferenceRoomId.resolves({ _id: 'live-call', rid: 'room1' });

		const result = await service.start('creator', 'room1', { allowRinging: true, customUrl: 'weekly-sync' });

		expect(result).to.deep.equal({ type: 'videoconference', callId: 'live-call', rid: 'room1' });
		expect(VideoConferenceModelMock.findOneActiveByConferenceRoomId.calledOnceWith('link1')).to.be.true;
		expect(VideoConferenceModelMock.createGroup.called).to.be.false;
		expect(sendMessage.called).to.be.false;
		expect(broadcast.called).to.be.false;
	});

	// Two people confirming the start at once: the unique link index lets one insert through, and the other
	// joins the conference that won instead of failing.
	it('a duplicate key returns the conference that won', async () => {
		VideoConferenceModelMock.createGroup.rejects(duplicateKeyError());
		VideoConferenceModelMock.findOneActiveByConferenceRoomId.onSecondCall().resolves({ _id: 'winner', rid: 'room1' });

		const result = await service.start('creator', 'room1', { customUrl: 'weekly-sync' });

		expect(result).to.deep.equal({ type: 'videoconference', callId: 'winner', rid: 'room1' });
		expect(sendMessage.called).to.be.false;
	});

	it('rethrows when nothing is live', async () => {
		VideoConferenceModelMock.createGroup.rejects(duplicateKeyError());

		await expect(service.start('creator', 'room1', { customUrl: 'weekly-sync' })).to.be.rejectedWith('E11000');
	});

	it('a one-to-one DM start from a link is a group conference', async () => {
		getTypeForRoom.callsFake(async (_room: IRoom, allowRinging: boolean) =>
			allowRinging ? { type: 'direct', status: VideoConferenceStatus.CALLING } : { type: 'videoconference' },
		);
		RoomsMock.findOneById.resolves({ _id: 'room1', t: 'd', uids: ['creator', 'other'] });

		const result = await service.start('creator', 'room1', { allowRinging: true, customUrl: 'weekly-sync' });

		expect(result.type).to.equal('videoconference');
		expect(VideoConferenceModelMock.createDirect.called).to.be.false;
		expect(VideoConferenceModelMock.createGroup.calledOnce).to.be.true;
	});

	it('a group DM keeps its ring', async () => {
		getTypeForRoom.resolves({ type: 'videoconference', ringing: true });

		await service.start('creator', 'room1', { allowRinging: true, customUrl: 'weekly-sync' });

		expect(VideoConferenceModelMock.createGroup.firstCall.args[0]).to.include({ ringing: true, conferenceRoomId: 'link1' });
	});

	it('refuses a livechat room', async () => {
		getTypeForRoom.resolves({ type: 'livechat' });

		await expect(service.start('creator', 'room1', { customUrl: 'weekly-sync' })).to.be.rejectedWith(
			'error-video-conf-links-not-supported',
		);
		expect(VideoConferenceModelMock.createGroup.called).to.be.false;
	});

	it('refuses a provider that is not embedded', async () => {
		providerCapabilities.current = undefined;
		service.getProviderManager = async () => ({ isFullyConfigured: async () => true });

		await expect(service.start('creator', 'room1', { customUrl: 'weekly-sync' })).to.be.rejectedWith(
			'error-video-conf-links-not-supported',
		);
		expect(VideoConferenceRoomsMock.findOneByUrl.called).to.be.false;
	});
});
