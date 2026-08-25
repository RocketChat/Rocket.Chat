import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, commonServiceStubs, providerCapabilities, resetAll } from './testHarness';
import { PRESENCE_LEASE_MS } from '../../../../../lib/videoConference/presence';

/**
 * The claim this suite is about is made through `Presence`, which the shared harness has no stub for — so this one
 * assembles `@rocket.chat/core-services` itself rather than teaching every other spec about presence.
 */
const proxyquire = require('proxyquire');

let fixture: VideoConference;

const PresenceMock = {
	setActiveState: sinon.stub().resolves(true),
	endActiveState: sinon.stub().resolves(true),
};

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	findActiveWithMembers: sinon.stub().callsFake(() => ({
		async *[Symbol.asyncIterator]() {
			yield cloneFixture(fixture);
		},
	})),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).leftAt = leftAt;
		}
	}),
	renewUsersPresenceById: sinon.stub().resolves(),
	markEmbeddedParticipantLeft: sinon.stub().resolves(),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture, data);
	}),
	setStatusById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const UsersMock = { findOneById: sinon.stub().resolves({ _id: 'joiner', language: 'en' }) };

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/core-services': {
		api: { broadcast: sinon.stub().resolves() },
		ServiceClassInternal: class {
			onEvent() {
				/* no-op */
			}
		},
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Room: { addUserToRoom: sinon.stub().resolves() },
		Presence: PresenceMock,
	},
	'@rocket.chat/models': {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		Rooms: { findOneById: sinon.stub().resolves(null) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: {
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
		},
	},
	'../../../lib/videoConference/constants': { availabilityErrors: {}, shouldRingVideoConference: () => false, CALL_FACES_SHOWN: 2 },
});

const ts = new Date('2026-08-02T10:00:00.000Z');
const at = (offsetMs: number) => new Date(ts.getTime() + offsetMs);

describe('VideoConfService presence while in a call', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(
			PresenceMock.setActiveState,
			PresenceMock.endActiveState,
			VideoConferenceModelMock.setUserLeftById,
			VideoConferenceModelMock.setUserJoinedById,
		);
		PresenceMock.setActiveState.resolves(true);
		// The busy claim only exists for embedded providers — they are the ones with a leave/sweep to release it.
		providerCapabilities.current = { embedded: true };
	});

	afterEach(() => {
		providerCapabilities.current = undefined;
	});

	// Being in a call is being busy, and saying so is what stops people ringing someone mid-conversation.
	it('claims busy when a member joins', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'host' })]);

		await service.addUser('call1', 'joiner');

		expect(PresenceMock.setActiveState.calledOnce).to.be.true;
		const [uid, claim] = PresenceMock.setActiveState.firstCall.args;
		expect(uid).to.equal('joiner');
		expect(claim).to.include({ statusDefault: UserStatus.BUSY, statusSource: 'internal', statusId: 'video-conference' });
	});

	// A *claim* rather than a status: the presence service keeps whatever it displaced and hands it back, so the
	// status someone chose before the call is the status they have after it. Ending by id is what lets a voice call's
	// own claim end in either order relative to this one.
	it('ends the claim by id when they leave, so their own status returns', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'other' }), buildMember({ _id: 'leaver' })]);

		await service.leaveCall('leaver', 'call1');

		expect(PresenceMock.endActiveState.calledWith('leaver', 'video-conference')).to.be.true;
	});

	// The departure nobody reported: a crashed tab leaves a status on busy, which is exactly the sort of thing
	// nobody thinks to put right by hand.
	it('ends the claim for a member whose presence lease ran out', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) })]);

		await service.expirePresenceLeases(at(0));

		expect(PresenceMock.endActiveState.calledWith('gone', 'video-conference')).to.be.true;
	});

	// When the call itself ends there is no leave left to arrive, so everyone still in it is owed their status back.
	it('ends the claim for everyone still in a call that ends', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'present' }),
			buildMember({ _id: 'left-earlier', leftAt: at(-60_000) }),
			buildMember({ _id: 'never-joined', joined: false, joinedAt: undefined }),
		]);

		await service.endCall('call1');

		const released = PresenceMock.endActiveState.args.map((args: any[]) => args[0] as string);
		expect(released).to.include('present');
		expect(released).to.not.include('left-earlier');
		expect(released).to.not.include('never-joined');
	});

	// Presence is a courtesy. A presence service that is down, or slow, or unlicensed must not be able to stop
	// someone joining a call.
	it('lets the join through when presence cannot be set', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'host' })]);
		PresenceMock.setActiveState.rejects(new Error('presence is unavailable'));

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
	});

	// A non-embedded provider (Jitsi, Meet, ...) has no leave, no heartbeat and no sweep — nothing would ever
	// release the claim, so a single Jitsi call would leave the user stuck on Busy forever.
	describe('for a non-embedded provider', () => {
		beforeEach(() => {
			providerCapabilities.current = undefined;
		});

		it('never claims busy on join, but still records the join', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'host' })]);

			await service.addUser('call1', 'joiner');

			expect(PresenceMock.setActiveState.called).to.be.false;
			expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
		});

		// No claim was ever made, so there is nothing to release — and releasing anyway would end a claim some
		// other feature (a voice call) legitimately holds.
		it('does not release anything on leave', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'other' }), buildMember({ _id: 'leaver' })]);

			await service.leaveCall('leaver', 'call1');

			expect(PresenceMock.endActiveState.called).to.be.false;
		});

		it('does not release anything when the call ends', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'present' })]);

			await service.endCall('call1');

			expect(PresenceMock.endActiveState.called).to.be.false;
		});
	});
});
