import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { buildLink, createService, duplicateKeyError, resetAll } from './testHarness';

const VideoConferenceRoomsMock = {
	findOneById: sinon.stub(),
	setTitleAndUrlById: sinon.stub(),
};
const VideoConferenceModelMock = {
	findOneById: sinon.stub(),
	setTitleById: sinon.stub(),
	updateOneById: sinon.stub(),
};
const MessagesMock = { setBlocksById: sinon.stub() };
const getConferenceRoomUrl = sinon.stub();
const broadcast = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast,
	models: { VideoConferenceRooms: VideoConferenceRoomsMock, VideoConference: VideoConferenceModelMock, Messages: MessagesMock },
	overrides: { '../../lib/videoConference/getConferenceRoomUrl': { getConferenceRoomUrl } },
});

describe('VideoConfService.renameRoom', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(
			broadcast,
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.setTitleById,
			VideoConferenceModelMock.updateOneById,
		);
		resetAll(MessagesMock.setBlocksById);
		for (const stub of [VideoConferenceRoomsMock.findOneById, VideoConferenceRoomsMock.setTitleAndUrlById, getConferenceRoomUrl]) {
			stub.reset();
		}
		VideoConferenceRoomsMock.findOneById.resolves(buildLink());
		getConferenceRoomUrl.callsFake(async (title: string) => title.toLowerCase().replace(/ /g, '-'));
		VideoConferenceRoomsMock.setTitleAndUrlById.callsFake(async (_id: string, title: string, url: string) =>
			buildLink({ _id, title, url }),
		);
	});

	it('renames and re-slugs', async () => {
		const link = await service.renameRoom('link1', '  Daily standup  ');

		expect(getConferenceRoomUrl.firstCall.args).to.deep.equal(['Daily standup', { currentUrl: 'weekly-sync' }]);
		expect(VideoConferenceRoomsMock.setTitleAndUrlById.calledOnceWith('link1', 'Daily standup', 'daily-standup')).to.be.true;
		expect(link).to.include({ title: 'Daily standup', url: 'daily-standup' });
	});

	// The helper answers the link's own address when the new title slugs to it, so the address survives.
	it('keeps the url for the same slug', async () => {
		getConferenceRoomUrl.resolves('weekly-sync');

		const link = await service.renameRoom('link1', 'WEEKLY SYNC');

		expect(VideoConferenceRoomsMock.setTitleAndUrlById.calledOnceWith('link1', 'WEEKLY SYNC', 'weekly-sync')).to.be.true;
		expect(link.url).to.equal('weekly-sync');
	});

	it('retries after a duplicate key', async () => {
		VideoConferenceRoomsMock.setTitleAndUrlById.onFirstCall().rejects(duplicateKeyError());

		await service.renameRoom('link1', 'Daily standup');

		expect(VideoConferenceRoomsMock.setTitleAndUrlById.callCount).to.equal(2);
		expect(getConferenceRoomUrl.callCount).to.equal(2);
	});

	it('refuses an unknown link', async () => {
		VideoConferenceRoomsMock.findOneById.resolves(null);

		await expect(service.renameRoom('link1', 'Daily standup')).to.be.rejectedWith('error-invalid-conference-room');
		expect(VideoConferenceRoomsMock.setTitleAndUrlById.called).to.be.false;
	});

	it('refuses a link deleted while it was being renamed', async () => {
		VideoConferenceRoomsMock.setTitleAndUrlById.resolves(null);

		await expect(service.renameRoom('link1', 'Daily standup')).to.be.rejectedWith('error-invalid-conference-room');
	});

	// A conference live from the link keeps its own title and address: the people in it are not renamed under.
	it('does not touch conferences', async () => {
		await service.renameRoom('link1', 'Daily standup');

		expect(VideoConferenceModelMock.findOneById.called).to.be.false;
		expect(VideoConferenceModelMock.setTitleById.called).to.be.false;
		expect(VideoConferenceModelMock.updateOneById.called).to.be.false;
		expect(MessagesMock.setBlocksById.called).to.be.false;
		expect(broadcast.called).to.be.false;
	});
});
