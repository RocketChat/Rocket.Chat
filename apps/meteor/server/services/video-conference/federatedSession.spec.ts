import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import {
	buildDirectCall,
	buildGroupCall,
	buildMember,
	cloneFixture,
	createService,
	providerCapabilities,
	resetAll,
	settingValues,
} from './testHarness';
import { PRESENCE_LEASE_MS } from '../../../lib/videoConference/presence';

/**
 * How a conference in a federated room keeps the MatrixRTC session told about this server's own members: this
 * server stands in for their Matrix clients, so every way into or out of the call is announced from here.
 */

const session = { mrid: '!abc:rc.example.com', slotId: 'm.call#ROOM' };

let fixture: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).leftAt = leftAt;
		}
	}),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture, data);
	}),
	setStatusById: sinon.stub().resolves(),
	setRingingById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().resolves(),
	renewUserPresenceById: sinon.stub().resolves({ revived: false, rid: 'room1', providerName: 'livekit' }),
	updateOne: sinon.stub().resolves({ modifiedCount: 1 }),
	find: sinon.stub().returns({ toArray: async () => [] }),
	findActiveWithMembers: sinon.stub().callsFake(() => ({
		async *[Symbol.asyncIterator]() {
			yield cloneFixture(fixture);
		},
	})),
};

const joiner = { _id: 'joiner', username: 'joiner.user', name: 'Joiner', avatarETag: null };

const UsersMock = { findOneById: sinon.stub().resolves(joiner), find: sinon.stub().returns({ toArray: async () => [] }) };

const MatrixRTCMembershipsMock = { findLocalByCallId: sinon.stub().returns({ toArray: async () => [] }) };

const FederationMatrixMock = { joinRTCSession: sinon.stub().resolves(), leaveRTCSession: sinon.stub().resolves() };

const broadcastStub = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast: broadcastStub,
	models: {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		MatrixRTCMemberships: MatrixRTCMembershipsMock,
		Subscriptions: {
			findByRoomId: sinon.stub().returns({ toArray: async () => [] }),
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: async () => [], forEach: async () => undefined }),
		},
	},
	services: {
		FederationMatrix: FederationMatrixMock,
		Presence: { setActiveState: sinon.stub().resolves(), endActiveState: sinon.stub().resolves() },
	},
});

const conferenceUpdates = (): unknown[] => broadcastStub.args.filter(([channel]) => channel === 'video-conference.updated');

describe('VideoConfService: this server members in a federated conference', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = { embedded: true };
		settingValues.Federation_Service_MatrixRTC_Enabled = true;
		resetAll(
			...Object.values(VideoConferenceModelMock),
			UsersMock.findOneById,
			MatrixRTCMembershipsMock.findLocalByCallId,
			FederationMatrixMock.joinRTCSession,
			FederationMatrixMock.leaveRTCSession,
			broadcastStub,
		);
		FederationMatrixMock.joinRTCSession.resetBehavior();
		FederationMatrixMock.joinRTCSession.resolves();
		VideoConferenceModelMock.updateOne.resolves({ modifiedCount: 1 });
	});

	afterEach(() => {
		providerCapabilities.current = undefined;
		delete settingValues.Federation_Service_MatrixRTC_Enabled;
	});

	describe('joining', () => {
		it('announces the member once they are on the roster', async () => {
			fixture = buildGroupCall([], { providerName: 'livekit', federation: session });

			await service.addUser('call1', 'joiner');

			expect(FederationMatrixMock.joinRTCSession.calledOnce).to.be.true;
			const [call, user] = FederationMatrixMock.joinRTCSession.firstCall.args;
			expect(call).to.include({ _id: 'call1' });
			expect(call.federation).to.deep.equal(session);
			expect(user).to.include({ _id: 'joiner' });
			expect(VideoConferenceModelMock.setUserJoinedById.calledBefore(FederationMatrixMock.joinRTCSession)).to.be.true;
		});

		it('announces the caller of a direct call before ringing the other side, which the ring relates to', async () => {
			fixture = buildDirectCall([buildMember({ _id: 'callee', joined: false, joinedAt: undefined })], {
				providerName: 'livekit',
				status: VideoConferenceStatus.CALLING,
				createdBy: { _id: 'joiner', username: 'joiner.user', name: 'Joiner' },
				federation: session,
			});

			await service.addUser('call1', 'joiner');

			expect(VideoConferenceModelMock.setUsersRingingById.calledOnce).to.be.true;
			expect(FederationMatrixMock.joinRTCSession.calledBefore(VideoConferenceModelMock.setUsersRingingById)).to.be.true;
		});

		it('still joins the member when the announcement fails: their call config reports it', async () => {
			fixture = buildGroupCall([], { providerName: 'livekit', federation: session });
			FederationMatrixMock.joinRTCSession.rejects(new Error('LiveKit is not configured'));

			await service.addUser('call1', 'joiner');

			expect(VideoConferenceModelMock.setUserJoinedById.calledOnce).to.be.true;
		});

		it('announces nothing for a conference outside a federated room', async () => {
			fixture = buildGroupCall([], { providerName: 'livekit' });

			await service.addUser('call1', 'joiner');

			expect(FederationMatrixMock.joinRTCSession.called).to.be.false;
		});
	});

	describe('renewing the lease', () => {
		it('confirms the announcement, which is what refreshes it before it runs out', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner' })], { providerName: 'livekit', federation: session });

			await service.renewPresence('joiner', 'call1');

			expect(FederationMatrixMock.joinRTCSession.calledOnce).to.be.true;
			expect(FederationMatrixMock.joinRTCSession.firstCall.args[1]).to.include({ _id: 'joiner' });
		});

		it('announces nothing for a lease that matched nothing', async () => {
			fixture = buildGroupCall([], { providerName: 'livekit', federation: session });
			VideoConferenceModelMock.renewUserPresenceById.resolves(null);

			await service.renewPresence('joiner', 'call1');

			expect(FederationMatrixMock.joinRTCSession.called).to.be.false;
			VideoConferenceModelMock.renewUserPresenceById.resolves({ revived: false, rid: 'room1', providerName: 'livekit' });
		});

		it('reads no conference while federated calls are off', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner' })], { providerName: 'livekit', federation: session });
			settingValues.Federation_Service_MatrixRTC_Enabled = false;

			await service.renewPresence('joiner', 'call1');

			expect(VideoConferenceModelMock.findOneById.called).to.be.false;
			expect(FederationMatrixMock.joinRTCSession.called).to.be.false;
		});
	});

	describe('leaving', () => {
		it('announces that the member left', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner' }), buildMember({ _id: 'other' })], {
				providerName: 'livekit',
				federation: session,
			});

			await service.leaveCall('joiner', 'call1');

			expect(FederationMatrixMock.leaveRTCSession.calledOnce).to.be.true;
			const [call, uid] = FederationMatrixMock.leaveRTCSession.firstCall.args;
			expect(call.federation).to.deep.equal(session);
			expect(uid).to.equal('joiner');
		});

		it('announces nothing for a conference outside a federated room', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner' }), buildMember({ _id: 'other' })], { providerName: 'livekit' });

			await service.leaveCall('joiner', 'call1');

			expect(FederationMatrixMock.leaveRTCSession.called).to.be.false;
		});

		it('announces the departure of a member whose lease ran out', async () => {
			const lastSeenAt = new Date(Date.now() - PRESENCE_LEASE_MS - 1000);
			fixture = buildGroupCall(
				[
					buildMember({
						_id: 'joiner',
						lastSeenAt,
						federation: { serverName: 'rc.example.com', transport: 't', livekitIdentity: 'i', local: true },
					}),
					buildMember({ _id: 'other', lastSeenAt: new Date() }),
				],
				{ providerName: 'livekit', federation: session },
			);

			await service.expirePresenceLeases(new Date());

			expect(FederationMatrixMock.leaveRTCSession.calledOnce).to.be.true;
			expect(FederationMatrixMock.leaveRTCSession.firstCall.args[1]).to.equal('joiner');
		});

		it('announces the departure of everyone this server announced when the conference ends', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'joiner' }), buildMember({ _id: 'other' })], {
				providerName: 'livekit',
				federation: session,
			});
			MatrixRTCMembershipsMock.findLocalByCallId.returns({
				toArray: async () => [
					{ uid: 'joiner', deviceId: 'A' },
					{ uid: 'joiner', deviceId: 'B' },
					{ uid: 'other', deviceId: 'C' },
				],
			});

			await service.setStatus('call1', VideoConferenceStatus.ENDED);

			expect(FederationMatrixMock.leaveRTCSession.args.map(([, uid]) => uid)).to.have.members(['joiner', 'other']);
			MatrixRTCMembershipsMock.findLocalByCallId.returns({ toArray: async () => [] });
		});
	});

	describe('roster entries', () => {
		const federation = {
			serverName: 'rc.example.com',
			transport: 'https://rc.example.com/matrixrtc/livekit-jwt',
			livekitIdentity: 'i',
			local: true,
		};

		it('records where a member publishes and tells the conference clients', async () => {
			await service.setMemberFederation('call1', 'joiner', federation);

			expect(VideoConferenceModelMock.updateOne.firstCall.args).to.deep.equal([
				{ '_id': 'call1', 'users._id': 'joiner' },
				{ $set: { 'users.$.federation': federation } },
			]);
			expect(conferenceUpdates()).to.have.lengthOf(1);
		});

		it('tells nobody when nothing changed', async () => {
			VideoConferenceModelMock.updateOne.resolves({ modifiedCount: 0 });

			await service.setMemberFederation('call1', 'joiner', federation);

			expect(conferenceUpdates()).to.have.lengthOf(0);
		});
	});
});
