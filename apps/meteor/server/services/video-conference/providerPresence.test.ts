import { afterEach, beforeEach, describe, it } from 'node:test';

import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, createService, providerCapabilities, resetAll, settingValues } from './testHarness';
import { EMPTY_CALL_GRACE_MS } from '../../../lib/videoConference/constants';

/**
 * Presence for a provider that reports who is connected (Pexip, through its event sink).
 *
 * The provider's report is the only thing that puts a member in the call or takes them out of it. Joining from
 * Rocket.Chat makes them a member and answers a ring; closing a window says nothing about their other windows
 * and devices. And the last member leaving does not end the call, since guests and phones nobody invited can
 * still be in it: the provider reports the call ending too.
 */
let fixture: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	unsetUserRingingById: sinon.stub().resolves(),
	setUserLeftById: sinon.stub().resolves(),
	setDataById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	addUserProviderParticipantById: sinon.stub().resolves(),
	setUserProviderParticipantLeftById: sinon.stub().resolves(),
	setUserJoinedIfConnectedById: sinon.stub().resolves(true),
	setUserLeftIfDisconnectedById: sinon.stub().resolves(true),
	setUserProviderParticipantWaitingById: sinon.stub().resolves(true),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const UsersMock = { findOneById: sinon.stub().resolves({ _id: 'joiner', username: 'joiner.user', name: 'Joiner', avatarETag: null }) };

const broadcastStub = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast: broadcastStub,
	models: { Users: UsersMock, VideoConference: VideoConferenceModelMock },
});

/** What the provider reports: a connection, `at` seconds into the call, and when it ended if it did. */
const connection = (id: string, at: number, endedAt?: number) => ({
	id,
	connectedAt: new Date(at * 1000),
	...(endedAt !== undefined && { leftAt: new Date(endedAt * 1000) }),
});

/** Whether the room's message block was told the roster changed — which a roster change always does. */
const roomWasNotified = () => broadcastStub.args.some(([channel]) => channel === 'room.video-conference');

describe('VideoConfService presence reported by the provider', () => {
	let service: any;
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = { providerPresence: true, persistentChat: true };
		settingValues.VideoConf_Conference_Window_Enabled = true;
		fixture = buildGroupCall([buildMember({ _id: 'host' }), buildMember({ _id: 'joiner', joined: false, joinedAt: undefined })]);
		resetAll(...Object.values(VideoConferenceModelMock), broadcastStub);
		VideoConferenceModelMock.setUserJoinedIfConnectedById.resolves(true);
		VideoConferenceModelMock.setUserLeftIfDisconnectedById.resolves(true);
		VideoConferenceModelMock.setUserProviderParticipantWaitingById.resolves(true);
		clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
	});

	afterEach(() => {
		clock.restore();
		providerCapabilities.current = undefined;
		delete settingValues.VideoConf_Conference_Window_Enabled;
	});

	describe('joining from Rocket.Chat', () => {
		it('makes the user a member and stops their ring, without putting them in the call', async () => {
			await service.addUser('call1', 'joiner');

			expect(VideoConferenceModelMock.addMemberById.calledWith('call1')).to.be.true;
			expect(VideoConferenceModelMock.unsetUserRingingById.calledWith('call1', 'joiner')).to.be.true;
			expect(VideoConferenceModelMock.setUserJoinedById.called).to.be.false;
		});

		// The other side of the line, so a regression can't pass by never marking anyone present at all.
		it('still puts them in the call for a provider that does not report presence', async () => {
			providerCapabilities.current = { persistentChat: true };

			await service.addUser('call1', 'joiner');

			expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
			expect(VideoConferenceModelMock.unsetUserRingingById.called).to.be.false;
		});
	});

	describe('a window reporting that it left', () => {
		it('takes nobody out of the call, and ends nothing', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'host' })]);

			await service.leaveCall('host', 'call1');
			await clock.tickAsync(EMPTY_CALL_GRACE_MS);

			expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
			expect(VideoConferenceModelMock.setDataById.called, 'ended the call').to.be.false;
		});

		it("still closes the leaver's own popups", async () => {
			fixture = buildGroupCall([buildMember({ _id: 'host' })]);

			await service.leaveCall('host', 'call1');

			const ends = broadcastStub.args.filter(([channel, payload]) => channel === 'user.video-conference' && payload.action === 'end');
			expect(ends.map(([, payload]) => payload.userId)).to.deep.equal(['host']);
		});
	});

	describe('the provider reporting a connection', () => {
		it('records it and puts the member in the call from the moment it connected', async () => {
			const participant = connection('p1', 100);

			await service.recordProviderParticipant('call1', 'joiner', participant);

			expect(VideoConferenceModelMock.addUserProviderParticipantById.calledWith('call1', 'joiner', participant)).to.be.true;
			expect(VideoConferenceModelMock.setUserJoinedIfConnectedById.calledWith('call1', 'joiner', participant.connectedAt)).to.be.true;
			expect(VideoConferenceModelMock.setUserLeftIfDisconnectedById.called).to.be.false;
			expect(roomWasNotified()).to.be.true;
		});

		// A second window or device of somebody already in the call: a new connection, and no roster change.
		it('tells the room nothing when the member was already in the call', async () => {
			VideoConferenceModelMock.setUserJoinedIfConnectedById.resolves(false);

			await service.recordProviderParticipant('call1', 'joiner', connection('p2', 200));

			expect(roomWasNotified()).to.be.false;
		});
	});

	describe('the provider reporting a connection ending', () => {
		it('records the end and takes the member out of the call when it was their last', async () => {
			const participant = connection('p1', 100, 300);

			await service.recordProviderParticipant('call1', 'joiner', participant);

			expect(VideoConferenceModelMock.setUserProviderParticipantLeftById.calledWith('call1', 'joiner', 'p1', participant.leftAt)).to.be
				.true;
			expect(
				VideoConferenceModelMock.setUserLeftIfDisconnectedById.calledWith('call1', 'joiner', participant.leftAt, participant.connectedAt),
			).to.be.true;
			expect(VideoConferenceModelMock.setUserJoinedIfConnectedById.called).to.be.false;
			expect(roomWasNotified()).to.be.true;
		});

		// Guests and phones the conference has no member for can still be in it.
		it('does not end the call when the last member leaves it', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner', leftAt: new Date() })]);

			await service.recordProviderParticipant('call1', 'joiner', connection('p1', 100, 300));
			await clock.tickAsync(EMPTY_CALL_GRACE_MS);

			expect(VideoConferenceModelMock.setDataById.called, 'ended the call').to.be.false;
		});
	});

	// Pexip is the only provider with an event sink, but the record is kept for any call; presence is not.
	it('only records the connection for a provider that does not report presence', async () => {
		providerCapabilities.current = { persistentChat: true };

		await service.recordProviderParticipant('call1', 'joiner', connection('p1', 100));

		expect(VideoConferenceModelMock.addUserProviderParticipantById.called).to.be.true;
		expect(VideoConferenceModelMock.setUserJoinedIfConnectedById.called).to.be.false;
		expect(roomWasNotified()).to.be.false;
	});

	// Whether a connection is waiting for a host is for the windows to follow, and has no say in presence.
	describe('the provider moving a connection in or out of the lobby', () => {
		const conferenceWasUpdated = () => broadcastStub.args.some(([channel]) => channel === 'video-conference.updated');

		it('records it and tells every window of the call', async () => {
			await service.setProviderParticipantWaiting('call1', 'joiner', 'p1', false);

			expect(VideoConferenceModelMock.setUserProviderParticipantWaitingById.calledWith('call1', 'joiner', 'p1', false)).to.be.true;
			expect(conferenceWasUpdated()).to.be.true;
		});

		// Pexip repeats the same service type on every update about the connection, mute or otherwise.
		it('tells nobody anything when the connection was already in that state', async () => {
			VideoConferenceModelMock.setUserProviderParticipantWaitingById.resolves(false);

			await service.setProviderParticipantWaiting('call1', 'joiner', 'p1', true);

			expect(conferenceWasUpdated()).to.be.false;
		});

		it('puts nobody in or out of the call', async () => {
			await service.setProviderParticipantWaiting('call1', 'joiner', 'p1', false);

			expect(VideoConferenceModelMock.setUserJoinedIfConnectedById.called).to.be.false;
			expect(VideoConferenceModelMock.setUserLeftIfDisconnectedById.called).to.be.false;
			expect(roomWasNotified()).to.be.false;
		});
	});
});
