import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { createService, resetAll } from './testHarness';

const VideoConferenceRoomsMock = { removeById: sinon.stub() };
const VideoConferenceModelMock = { findOneById: sinon.stub(), updateOneById: sinon.stub(), setEndedById: sinon.stub() };
const broadcast = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast,
	models: { VideoConferenceRooms: VideoConferenceRoomsMock, VideoConference: VideoConferenceModelMock },
});

describe('VideoConfService.deleteRoom', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(
			broadcast,
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.updateOneById,
			VideoConferenceModelMock.setEndedById,
		);
		VideoConferenceRoomsMock.removeById.reset();
		VideoConferenceRoomsMock.removeById.resolves({ deletedCount: 1 });
	});

	it('removes only that link', async () => {
		await service.deleteRoom('link1');

		expect(VideoConferenceRoomsMock.removeById.calledOnceWith('link1')).to.be.true;
	});

	it('refuses an unknown link', async () => {
		VideoConferenceRoomsMock.removeById.resolves({ deletedCount: 0 });

		await expect(service.deleteRoom('link1')).to.be.rejectedWith('error-invalid-conference-room');
	});

	// The conference live from the link keeps running under the address it was started with.
	it('leaves a live conference alone and broadcasts nothing', async () => {
		await service.deleteRoom('link1');

		expect(VideoConferenceModelMock.findOneById.called).to.be.false;
		expect(VideoConferenceModelMock.updateOneById.called).to.be.false;
		expect(VideoConferenceModelMock.setEndedById.called).to.be.false;
		expect(broadcast.called).to.be.false;
	});
});
