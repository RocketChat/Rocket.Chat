import { beforeEach, describe, it } from 'node:test';

import type { IVideoConferenceRoom, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildLink, createService } from './testHarness';

let byId: VideoConference | null;
let byCustomUrl: VideoConference | null;
let byLink: VideoConference | null;
let link: IVideoConferenceRoom | null;

const VideoConferenceModelMock = {
	findOneById: sinon.stub(),
	findOneActiveByCustomUrl: sinon.stub(),
	findOneActiveByConferenceRoomId: sinon.stub(),
	createGroup: sinon.stub(),
	insertOne: sinon.stub(),
	updateOneById: sinon.stub(),
};
const VideoConferenceRoomsMock = { findOneByUrl: sinon.stub(), create: sinon.stub(), setTitleAndUrlById: sinon.stub() };

const VideoConfService = createService({
	models: { VideoConference: VideoConferenceModelMock, VideoConferenceRooms: VideoConferenceRoomsMock },
});

const noProviderData = { projection: { providerData: 0 } };

describe('VideoConfService.resolve', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		byId = null;
		byCustomUrl = null;
		byLink = null;
		link = null;
		for (const stub of [...Object.values(VideoConferenceModelMock), ...Object.values(VideoConferenceRoomsMock)]) {
			stub.reset();
		}
		VideoConferenceModelMock.findOneById.callsFake(async () => byId);
		VideoConferenceModelMock.findOneActiveByCustomUrl.callsFake(async () => byCustomUrl);
		VideoConferenceModelMock.findOneActiveByConferenceRoomId.callsFake(async () => byLink);
		VideoConferenceRoomsMock.findOneByUrl.callsFake(async () => link);
	});

	// An existing call id must cost what it costs today: one read, nothing about links.
	it('answers a conference by its id, whatever its status, with one read', async () => {
		byId = buildGroupCall([], { status: VideoConferenceStatus.ENDED });

		expect(await service.resolve('call1')).to.equal(byId);
		expect(VideoConferenceModelMock.findOneById.calledOnceWith('call1', noProviderData)).to.be.true;
		expect(VideoConferenceModelMock.findOneActiveByCustomUrl.called).to.be.false;
		expect(VideoConferenceRoomsMock.findOneByUrl.called).to.be.false;
		expect(VideoConferenceModelMock.findOneActiveByConferenceRoomId.called).to.be.false;
	});

	// A renamed or deleted link's old address keeps reaching the conference started under it until that ends.
	it('answers the live conference started under the address', async () => {
		byCustomUrl = buildGroupCall([], { _id: 'call2', customUrl: 'weekly-sync' });
		link = buildLink();

		expect(await service.resolve('weekly-sync')).to.equal(byCustomUrl);
		expect(VideoConferenceModelMock.findOneActiveByCustomUrl.calledOnceWith('weekly-sync', noProviderData)).to.be.true;
		expect(VideoConferenceRoomsMock.findOneByUrl.called).to.be.false;
	});

	it("answers a link's live conference", async () => {
		link = buildLink();
		byLink = buildGroupCall([], { _id: 'call3', conferenceRoomId: 'link1', customUrl: 'old-address' });

		expect(await service.resolve('weekly-sync')).to.equal(byLink);
		expect(VideoConferenceModelMock.findOneActiveByConferenceRoomId.calledOnceWith('link1', noProviderData)).to.be.true;
	});

	it('placeholder shape', async () => {
		link = buildLink();

		const placeholder = await service.resolve('weekly-sync');

		expect(placeholder).to.deep.equal({
			_id: 'link1',
			_updatedAt: link._updatedAt,
			type: 'videoconference',
			status: VideoConferenceStatus.NOT_STARTED,
			title: 'Weekly sync',
			rid: 'room1',
			providerName: 'livekit',
			createdAt: link.createdAt,
			createdBy: link.createdBy,
			conferenceRoomId: 'link1',
			customUrl: 'weekly-sync',
			users: [],
			messages: {},
			anonymousUsers: 0,
		});
		expect(placeholder).to.not.have.property('url');
	});

	it('the placeholder is not written', async () => {
		link = buildLink();

		await service.resolve('weekly-sync');

		for (const stub of [
			VideoConferenceModelMock.createGroup,
			VideoConferenceModelMock.insertOne,
			VideoConferenceModelMock.updateOneById,
			VideoConferenceRoomsMock.create,
			VideoConferenceRoomsMock.setTitleAndUrlById,
		]) {
			expect(stub.called).to.be.false;
		}
	});

	it('answers null when nothing matches', async () => {
		expect(await service.resolve('nothing-here')).to.be.null;
		expect(VideoConferenceRoomsMock.findOneByUrl.calledOnceWith('nothing-here')).to.be.true;
	});
});
