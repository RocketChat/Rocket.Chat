import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { activeProviderStubs, buildLink, createService, duplicateKeyError, providerCapabilities, resetAll } from './testHarness';

const VideoConferenceRoomsMock = {
	create: sinon.stub(),
	findOneById: sinon.stub(),
};
const RoomsMock = { findOneById: sinon.stub() };
const UsersMock = { findOneById: sinon.stub() };
const getConferenceRoomUrl = sinon.stub();
const broadcast = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast,
	models: { VideoConferenceRooms: VideoConferenceRoomsMock, Rooms: RoomsMock, Users: UsersMock },
	overrides: {
		...activeProviderStubs,
		'../../lib/videoConference/getConferenceRoomUrl': { getConferenceRoomUrl },
	},
});

describe('VideoConfService.createRoom', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = { embedded: true };
		resetAll(broadcast);
		for (const stub of [
			VideoConferenceRoomsMock.create,
			VideoConferenceRoomsMock.findOneById,
			RoomsMock.findOneById,
			UsersMock.findOneById,
			getConferenceRoomUrl,
		]) {
			stub.reset();
		}
		RoomsMock.findOneById.resolves({ _id: 'room1', t: 'p' });
		UsersMock.findOneById.resolves({ _id: 'creator', name: 'Creator User', username: 'creator.user' });
		getConferenceRoomUrl.callsFake(async (title: string) => title.toLowerCase().replace(/ /g, '-'));
		VideoConferenceRoomsMock.create.resolves('link1');
		VideoConferenceRoomsMock.findOneById.callsFake(async (_id: string) => buildLink({ _id }));
	});

	afterEach(() => {
		providerCapabilities.current = undefined;
	});

	it('stores the link', async () => {
		const link = await service.createRoom('creator', 'room1', '  Weekly sync  ');

		expect(getConferenceRoomUrl.calledOnceWith('Weekly sync')).to.be.true;
		expect(VideoConferenceRoomsMock.create.firstCall.args[0]).to.deep.equal({
			rid: 'room1',
			providerName: 'livekit',
			title: 'Weekly sync',
			url: 'weekly-sync',
			createdBy: { _id: 'creator', name: 'Creator User', username: 'creator.user' },
		});
		expect(link).to.deep.equal(buildLink());
	});

	// Links open in the call window, so a provider that hands calls off to a page of its own cannot serve one.
	it('refuses a provider that is not embedded', async () => {
		providerCapabilities.current = undefined;
		service.getProviderManager = async () => ({ isFullyConfigured: async () => true });

		await expect(service.createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('error-video-conf-links-not-supported');
		expect(VideoConferenceRoomsMock.create.called).to.be.false;
	});

	it('surfaces the availability error', async () => {
		const NoProviderService = createService({ models: { VideoConferenceRooms: VideoConferenceRoomsMock } });

		await expect(new NoProviderService().createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('no-videoconf-provider-app');
	});

	it('refuses a room that does not exist', async () => {
		RoomsMock.findOneById.resolves(null);

		await expect(service.createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('invalid-room');
	});

	it('refuses a livechat room', async () => {
		RoomsMock.findOneById.resolves({ _id: 'room1', t: 'l' });

		await expect(service.createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('error-video-conf-links-not-supported');
		expect(VideoConferenceRoomsMock.create.called).to.be.false;
	});

	// Two links created at once can compute the same address; the unique index rejects the second, which then
	// asks for an address again and finds the first one taken.
	it('retries after a duplicate key', async () => {
		VideoConferenceRoomsMock.create.onFirstCall().rejects(duplicateKeyError());
		VideoConferenceRoomsMock.create.onSecondCall().resolves('link2');

		const link = await service.createRoom('creator', 'room1', 'Weekly sync');

		expect(VideoConferenceRoomsMock.create.callCount).to.equal(2);
		expect(getConferenceRoomUrl.callCount).to.equal(2);
		expect(link._id).to.equal('link2');
	});

	it('gives up after the bound', async () => {
		VideoConferenceRoomsMock.create.rejects(duplicateKeyError());

		await expect(service.createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('E11000');
		expect(VideoConferenceRoomsMock.create.callCount).to.equal(3);
	});

	it('lets any other error out at once', async () => {
		VideoConferenceRoomsMock.create.rejects(new Error('boom'));

		await expect(service.createRoom('creator', 'room1', 'Weekly sync')).to.be.rejectedWith('boom');
		expect(VideoConferenceRoomsMock.create.callCount).to.equal(1);
	});

	it('broadcasts nothing', async () => {
		await service.createRoom('creator', 'room1', 'Weekly sync');

		expect(broadcast.called).to.be.false;
	});
});
