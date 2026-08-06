import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, createService, resetAll } from './testHarness';

let call: VideoConference | null = null;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => call),
	setTitleById: sinon.stub().resolves(),
};

const broadcast = sinon.stub().resolves();

const VideoConfService = createService({ broadcast, models: { VideoConference: VideoConferenceModelMock } });

describe('VideoConfService.renameCall', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(VideoConferenceModelMock.findOneById, VideoConferenceModelMock.setTitleById, broadcast);
		call = buildGroupCall([buildMember({ _id: 'creator' })]);
	});

	it('names the conference', async () => {
		await service.renameCall('creator', 'call1', 'Release planning');

		expect(VideoConferenceModelMock.setTitleById.calledWith('call1', 'Release planning')).to.be.true;
	});

	// The name reaches the room's own call UI, which reads the conference rather than being handed the change.
	it('tells the room the conference changed', async () => {
		await service.renameCall('creator', 'call1', 'Release planning');

		expect(broadcast.calledWith('room.video-conference', { rid: 'room1', callId: 'call1' })).to.be.true;
	});

	it('keeps only what was typed, without the whitespace around it', async () => {
		await service.renameCall('creator', 'call1', '  Release planning  ');

		expect(VideoConferenceModelMock.setTitleById.firstCall.args[1]).to.equal('Release planning');
	});

	it('refuses a name that is nothing but whitespace', async () => {
		await expect(service.renameCall('creator', 'call1', '   ')).to.be.rejectedWith('error-invalid-name');
		expect(VideoConferenceModelMock.setTitleById.called).to.be.false;
	});

	// A title everyone in the call could rewrite is a title nobody can rely on.
	it('refuses anyone but the person who started the call', async () => {
		await expect(service.renameCall('someone-else', 'call1', 'Release planning')).to.be.rejectedWith('error-not-allowed');
		expect(VideoConferenceModelMock.setTitleById.called).to.be.false;
	});

	// A direct call is named after the other person, per viewer — there is no one title to set.
	it('refuses a direct call', async () => {
		call = buildDirectCall([buildMember({ _id: 'creator' })]);

		await expect(service.renameCall('creator', 'call1', 'Release planning')).to.be.rejectedWith('error-invalid-video-conf');
	});

	it('refuses a call that has already ended', async () => {
		call = buildGroupCall([buildMember({ _id: 'creator' })], { endedAt: new Date('2026-01-01T01:00:00.000Z') });

		await expect(service.renameCall('creator', 'call1', 'Release planning')).to.be.rejectedWith('error-invalid-video-conf');
	});

	it('refuses a call that does not exist', async () => {
		call = null;

		await expect(service.renameCall('creator', 'call1', 'Release planning')).to.be.rejectedWith('error-invalid-video-conf');
	});
});
