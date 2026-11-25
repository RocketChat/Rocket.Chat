import { beforeEach, describe, it } from 'node:test';

import type { IVideoConferenceRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildLink, createService } from './testHarness';

let links: IVideoConferenceRoom[];
let live: { _id: string; conferenceRoomId: string }[];

const VideoConferenceRoomsMock = { findByRoomId: sinon.stub() };
const VideoConferenceModelMock = { findActiveByConferenceRoomIds: sinon.stub(), findOneActiveByConferenceRoomId: sinon.stub() };

const VideoConfService = createService({
	models: { VideoConferenceRooms: VideoConferenceRoomsMock, VideoConference: VideoConferenceModelMock },
});

describe('VideoConfService.listRooms', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		links = [buildLink({ _id: 'link1', url: 'a' }), buildLink({ _id: 'link2', url: 'b' }), buildLink({ _id: 'link3', url: 'c' })];
		live = [{ _id: 'call2', conferenceRoomId: 'link2' }];
		VideoConferenceRoomsMock.findByRoomId.reset();
		VideoConferenceModelMock.findActiveByConferenceRoomIds.reset();
		VideoConferenceModelMock.findOneActiveByConferenceRoomId.reset();
		VideoConferenceRoomsMock.findByRoomId.callsFake(() => ({ toArray: async () => links }));
		VideoConferenceModelMock.findActiveByConferenceRoomIds.callsFake(() => ({ toArray: async () => live }));
	});

	// A room's menu lists every link with its state; a read per link would grow with the list.
	it('asks for the live conferences once', async () => {
		await service.listRooms('room1');

		expect(VideoConferenceRoomsMock.findByRoomId.calledOnceWith('room1')).to.be.true;
		expect(VideoConferenceModelMock.findActiveByConferenceRoomIds.calledOnce).to.be.true;
		expect(VideoConferenceModelMock.findActiveByConferenceRoomIds.firstCall.args[0]).to.deep.equal(['link1', 'link2', 'link3']);
		expect(VideoConferenceModelMock.findOneActiveByConferenceRoomId.called).to.be.false;
	});

	it('ongoingCallId only for live links', async () => {
		const rooms = await service.listRooms('room1');

		expect(rooms.map(({ _id }: IVideoConferenceRoom) => _id)).to.deep.equal(['link1', 'link2', 'link3']);
		expect(rooms[1]).to.deep.equal({ ...links[1], ongoingCallId: 'call2' });
		expect(rooms[0]).to.not.have.property('ongoingCallId');
		expect(rooms[2]).to.not.have.property('ongoingCallId');
	});

	it('answers an empty list for a room without links', async () => {
		links = [];

		expect(await service.listRooms('room1')).to.deep.equal([]);
	});
});
