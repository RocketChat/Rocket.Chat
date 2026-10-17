import type { IMatrixRTCMembership, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import {
	buildDirectCall,
	buildGroupCall,
	buildMember,
	cloneFixture,
	commonServiceStubs,
	createService,
	providerCapabilities,
	resetAll,
	settingValues,
} from './testHarness';
import { EMPTY_CALL_GRACE_MS } from '../../../lib/videoConference/constants';
import { PRESENCE_LEASE_MS } from '../../../lib/videoConference/presence';

/**
 * A conference in a federated room mirrors the room's MatrixRTC session: it exists while anyone is in the session,
 * on whichever server they are, and its roster follows the memberships other servers announce.
 */

const session = { mrid: '!abc:remote.example.org', slotId: 'm.call#ROOM' };
const NOW = new Date('2026-10-07T12:00:00.000Z');

const federatedRoom = {
	_id: 'room1',
	t: 'c',
	name: 'room',
	fname: 'room:remote.example.org',
	federated: true,
	federation: { version: 1, mrid: session.mrid, origin: 'remote.example.org' },
};

let fixture: VideoConference | null;
let room: Record<string, unknown>;

const remoteMembership = (overrides: Partial<IMatrixRTCMembership> = {}): IMatrixRTCMembership => ({
	_id: 'membership-bob',
	_updatedAt: NOW,
	rid: 'room1',
	mrid: session.mrid,
	slotId: session.slotId,
	mode: 'compatibility',
	userId: '@bob:remote.example.org',
	uid: 'bob',
	local: false,
	deviceId: 'DEVICEB',
	memberId: '@bob:remote.example.org:DEVICEB',
	stateKey: '_@bob:remote.example.org_DEVICEB_m.call',
	eventId: '$member',
	transport: { type: 'livekit', serviceUrl: 'https://remote.example.org/livekit/jwt' },
	serverName: 'remote.example.org',
	livekitIdentity: '@bob:remote.example.org:DEVICEB',
	livekitIdentityAliases: [],
	joinedAt: new Date(NOW.getTime() - 60_000),
	expiresAt: new Date(NOW.getTime() + 3_600_000),
	...overrides,
});

const bobFederation = {
	serverName: 'remote.example.org',
	transport: 'https://remote.example.org/livekit/jwt',
	livekitIdentity: '@bob:remote.example.org:DEVICEB',
	livekitIdentityAliases: [],
	local: false,
};

let memberships: IMatrixRTCMembership[] = [];

const VideoConferenceModelMock = {
	findOne: sinon.stub().callsFake(async () => (fixture && !fixture.endedAt ? cloneFixture(fixture) : null)),
	findOneById: sinon.stub().callsFake(async () => (fixture ? cloneFixture(fixture) : null)),
	createGroup: sinon.stub().callsFake(async (data: Partial<VideoConference>) => {
		fixture = buildGroupCall([], { ...data, _id: 'new-call' } as any);
		return 'new-call';
	}),
	createDirect: sinon.stub().callsFake(async (data: Partial<VideoConference>) => {
		fixture = buildDirectCall([], { ...data, _id: 'new-call', status: VideoConferenceStatus.CALLING, ringing: true } as any);
		return 'new-call';
	}),
	setStatusById: sinon.stub().callsFake(async (_callId: string, status: VideoConferenceStatus) => {
		fixture!.status = status;
	}),
	setMessageById: sinon.stub().resolves(),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture!, data);
	}),
	setRingingById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().callsFake(async (_callId: string, uids: string[], ringingAt = new Date()) => {
		fixture!.users.filter(({ _id }) => uids.includes(_id)).forEach((user) => Object.assign(user, { ringingAt }));
	}),
	setUserDeclinedById: sinon.stub().callsFake(async (_callId: string, uid: string) => {
		Object.assign(
			fixture!.users.find(({ _id }) => _id === uid)!,
			{ declined: true },
		);
	}),
	addMemberById: sinon.stub().callsFake(async (_callId: string, user: IVideoConferenceUser) => {
		if (!fixture!.users.some(({ _id }) => _id === user._id)) {
			fixture!.users.push({ ...user, joined: false });
		}
	}),
	setUserJoinedById: sinon.stub().callsFake(async (_callId: string, uid: string, joinedAt: Date) => {
		const member = fixture!.users.find(({ _id }) => _id === uid)!;
		Object.assign(member, { joined: true, joinedAt, lastSeenAt: joinedAt, leftAt: undefined });
	}),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		Object.assign(
			fixture!.users.find(({ _id }) => _id === uid)!,
			{ leftAt },
		);
	}),
	updateOne: sinon.stub().callsFake(async (filter: { 'users._id': string }, update: { $set: { 'users.$.federation': unknown } }) => {
		const member = fixture?.users.find(({ _id }) => _id === filter['users._id']);
		if (!member || JSON.stringify(member.federation) === JSON.stringify(update.$set['users.$.federation'])) {
			return { modifiedCount: 0 };
		}
		member.federation = update.$set['users.$.federation'] as IVideoConferenceUser['federation'];
		return { modifiedCount: 1 };
	}),
	find: sinon.stub().returns({ toArray: async () => [] }),
	findActiveWithMembers: sinon.stub().callsFake(() => ({
		async *[Symbol.asyncIterator]() {
			yield cloneFixture(fixture!);
		},
	})),
};

const MatrixRTCMembershipsMock = {
	findActiveBySession: sinon.stub().callsFake(() => ({ toArray: async () => memberships })),
	attachSessionToCall: sinon.stub().resolves(),
	findExpired: sinon.stub().callsFake(() => ({ toArray: async () => memberships.filter(({ expiresAt }) => expiresAt <= NOW) })),
	removeByIds: sinon.stub().callsFake(async (ids: string[]) => {
		memberships = memberships.filter(({ _id }) => !ids.includes(_id));
	}),
	findLocalByCallId: sinon.stub().returns({ toArray: async () => [] }),
};

const users: Record<string, unknown> = {
	alice: { _id: 'alice', username: 'alice', name: 'Alice', avatarETag: null },
	dave: { _id: 'dave', username: 'dave', name: 'Dave', avatarETag: null },
	bob: {
		_id: 'bob',
		username: '@bob:remote.example.org',
		name: '@bob:remote.example.org',
		avatarETag: null,
		federated: true,
		federation: { version: 1, mui: '@bob:remote.example.org', origin: 'remote.example.org' },
	},
	carol: {
		_id: 'carol',
		username: '@carol:remote.example.org',
		name: '@carol:remote.example.org',
		avatarETag: null,
		federated: true,
		federation: { version: 1, mui: '@carol:remote.example.org', origin: 'remote.example.org' },
	},
};

const UsersMock = {
	findOneById: sinon.stub().callsFake(async (uid: string) => users[uid] ?? null),
	find: sinon.stub().callsFake((query: { _id: { $in: string[] } }) => ({
		toArray: async () => query._id.$in.map((uid) => users[uid]).filter(Boolean),
	})),
};

const FederationMatrixMock = {
	joinRTCSession: sinon.stub().resolves(),
	leaveRTCSession: sinon.stub().resolves(),
	notifyRTCSession: sinon.stub().resolves(),
	declineRTCSession: sinon.stub().resolves(),
};

const sendMessageStub = sinon.stub().resolves({ _id: 'msg1' });
const broadcastStub = sinon.stub().resolves();

const VideoConfService = createService({
	broadcast: broadcastStub,
	models: {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		MatrixRTCMemberships: MatrixRTCMembershipsMock,
		Rooms: { findOneById: sinon.stub().callsFake(async () => room) },
		Subscriptions: {
			findByRoomId: sinon.stub().returns({ toArray: async () => [] }),
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: async () => [], forEach: async () => undefined }),
		},
	},
	services: {
		FederationMatrix: FederationMatrixMock,
		Presence: { setActiveState: sinon.stub().resolves(), endActiveState: sinon.stub().resolves() },
	},
	overrides: {
		'../../lib/messages/sendMessage': { sendMessage: sendMessageStub },
		'../../lib/videoConfProviders': {
			videoConfProviders: {
				...commonServiceStubs['../../lib/videoConfProviders'].videoConfProviders,
				hasAnyProvider: () => true,
				getActiveProvider: () => activeProvider,
				getProviderCapabilities: () => providerCapabilities.current,
			},
		},
		'../../lib/videoConfTypes': {
			videoConfTypes: { isCallManagedByApp: () => false, getTypeForRoom: async () => ({ type: 'videoconference' }) },
		},
	},
});

let activeProvider = 'livekit';

const conferenceUpdates = () => broadcastStub.args.filter(([channel]) => channel === 'video-conference.updated');
const member = (uid: string) => fixture?.users.find(({ _id }) => _id === uid);

describe('VideoConfService: conferences in federated rooms', () => {
	let service: any;
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		clock = sinon.useFakeTimers({ now: NOW, toFake: ['Date', 'setTimeout'] });
		service = new VideoConfService();
		fixture = null;
		room = { ...federatedRoom };
		memberships = [];
		activeProvider = 'livekit';
		providerCapabilities.current = { embedded: true };
		settingValues.Federation_Service_MatrixRTC_Enabled = true;
		resetAll(
			...Object.values(VideoConferenceModelMock),
			...Object.values(MatrixRTCMembershipsMock),
			...Object.values(FederationMatrixMock),
			UsersMock.find,
			sendMessageStub,
			broadcastStub,
		);
	});

	afterEach(() => {
		clock.restore();
		providerCapabilities.current = undefined;
		delete settingValues.Federation_Service_MatrixRTC_Enabled;
	});

	describe('starting a call', () => {
		it('mirrors the room session in the new conference', async () => {
			await service.start('alice', 'room1', { title: 'Standup' });

			expect(VideoConferenceModelMock.createGroup.calledOnce).to.be.true;
			expect(VideoConferenceModelMock.createGroup.firstCall.args[0]).to.deep.include({ federation: session, providerName: 'livekit' });
		});

		it('joins the conference already mirroring the session instead of starting a second one', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'bob', federation: bobFederation })], {
				_id: 'running',
				providerName: 'livekit',
				federation: session,
			});

			await expect(service.start('alice', 'room1', {})).to.eventually.deep.equal({
				type: 'videoconference',
				callId: 'running',
				rid: 'room1',
			});
			expect(VideoConferenceModelMock.createGroup.called).to.be.false;
		});

		it('starts one conference for two starts that arrive together', async () => {
			await Promise.all([service.start('alice', 'room1', {}), service.start('alice', 'room1', {})]);

			expect(VideoConferenceModelMock.createGroup.calledOnce).to.be.true;
		});

		it('refuses while federated calls are off', async () => {
			settingValues.Federation_Service_MatrixRTC_Enabled = false;

			await expect(service.start('alice', 'room1', {})).to.be.rejectedWith('error-videoconf-federation-disabled');
		});

		it('refuses a provider other than the embedded LiveKit', async () => {
			activeProvider = 'jitsi';

			await expect(service.start('alice', 'room1', {})).to.be.rejectedWith('error-videoconf-federation-requires-livekit');
		});

		it('leaves calls in other rooms as they were', async () => {
			room = { _id: 'room1', t: 'c', name: 'room' };

			await service.start('alice', 'room1', {});

			expect(VideoConferenceModelMock.createGroup.firstCall.args[0]).to.not.have.property('federation');
		});
	});

	describe('a member of another server joining the session', () => {
		it('starts a conference for them when none is running, with the usual call message', async () => {
			memberships = [remoteMembership()];

			await expect(service.syncFederatedSession('room1', session)).to.eventually.equal('new-call');

			expect(VideoConferenceModelMock.createGroup.firstCall.args[0]).to.deep.include({
				federation: session,
				providerName: 'livekit',
				title: 'room:remote.example.org',
				createdBy: { _id: 'bob', name: '@bob:remote.example.org', username: '@bob:remote.example.org' },
			});
			expect(sendMessageStub.calledOnce).to.be.true;
			expect(sendMessageStub.firstCall.args[0]).to.include({ _id: 'bob' });
			expect(VideoConferenceModelMock.setMessageById.calledWith('new-call', 'started', 'msg1')).to.be.true;
			expect(MatrixRTCMembershipsMock.attachSessionToCall.calledWith(session.mrid, session.slotId, 'new-call')).to.be.true;
		});

		it('starts a direct call, already under way, in a direct message between two people', async () => {
			room = { ...federatedRoom, t: 'd', uids: ['alice', 'bob'] };
			memberships = [remoteMembership()];

			await service.syncFederatedSession('room1', session);

			expect(VideoConferenceModelMock.createDirect.calledOnce).to.be.true;
			expect(VideoConferenceModelMock.createDirect.firstCall.args[0]).to.deep.include({ federation: session });
			expect(fixture?.status).to.equal(VideoConferenceStatus.STARTED);
		});

		it('is started by whoever joined the session first', async () => {
			memberships = [remoteMembership({ _id: 'm-carol', uid: 'carol', joinedAt: new Date(NOW.getTime() - 1000) }), remoteMembership()];

			await service.syncFederatedSession('room1', session);

			expect(VideoConferenceModelMock.createGroup.firstCall.args[0].createdBy).to.include({ _id: 'bob' });
		});

		it('puts them on the roster, with where they publish, and tells the conference clients', async () => {
			memberships = [remoteMembership()];

			await service.syncFederatedSession('room1', session);

			expect(member('bob')).to.deep.include({ joined: true, joinedAt: NOW, federation: bobFederation });
			expect(member('bob')?.leftAt).to.be.undefined;
			expect(conferenceUpdates()).to.not.be.empty;
		});

		it('starts nothing while federated calls are off', async () => {
			settingValues.Federation_Service_MatrixRTC_Enabled = false;
			memberships = [remoteMembership()];

			await expect(service.syncFederatedSession('room1', session)).to.eventually.be.undefined;
			expect(VideoConferenceModelMock.createGroup.called).to.be.false;
		});

		it('starts nothing for a session nobody else is in', async () => {
			memberships = [remoteMembership({ local: true, uid: 'alice' })];

			await expect(service.syncFederatedSession('room1', session)).to.eventually.be.undefined;
			expect(VideoConferenceModelMock.createGroup.called).to.be.false;
		});
	});

	describe('a running conference', () => {
		beforeEach(() => {
			fixture = buildGroupCall(
				[buildMember({ _id: 'alice', federation: { serverName: 'rc.example.com', transport: 't', livekitIdentity: 'a', local: true } })],
				{ providerName: 'livekit', federation: session },
			);
		});

		it('shows a member on one roster entry, from their latest device', async () => {
			memberships = [
				remoteMembership(),
				remoteMembership({ _id: 'second-device', deviceId: 'DEVICEC', livekitIdentity: '@bob:remote.example.org:DEVICEC', joinedAt: NOW }),
			];

			await service.syncFederatedSession('room1', session);

			expect(fixture!.users.filter(({ _id }) => _id === 'bob')).to.have.lengthOf(1);
			expect(member('bob')?.federation?.livekitIdentity).to.equal('@bob:remote.example.org:DEVICEC');
		});

		it('says nothing when nothing changed', async () => {
			memberships = [remoteMembership()];
			await service.syncFederatedSession('room1', session);
			broadcastStub.resetHistory();

			await service.syncFederatedSession('room1', session);

			expect(conferenceUpdates()).to.be.empty;
		});

		it('leaves a member out once none of their memberships counts, keeping where they published', async () => {
			memberships = [remoteMembership()];
			await service.syncFederatedSession('room1', session);
			memberships = [];
			broadcastStub.resetHistory();

			await service.syncFederatedSession('room1', session);

			expect(member('bob')).to.deep.include({ leftAt: NOW, federation: bobFederation });
			expect(conferenceUpdates()).to.not.be.empty;
		});

		it('never takes this server own members off the roster: their leases do that', async () => {
			memberships = [];

			await service.syncFederatedSession('room1', session);

			expect(member('alice')?.leftAt).to.be.undefined;
		});

		it('ends once the last member of any server is gone, after the usual grace', async () => {
			fixture!.users = [];
			memberships = [remoteMembership()];
			await service.syncFederatedSession('room1', session);
			memberships = [];

			await service.syncFederatedSession('room1', session);
			expect(fixture!.endedAt).to.be.undefined;

			await clock.tickAsync(EMPTY_CALL_GRACE_MS);

			expect(fixture!.status).to.equal(VideoConferenceStatus.ENDED);
		});

		it('keeps members of other servers out of the lease sweep: their own server renews them', async () => {
			memberships = [remoteMembership()];
			await service.syncFederatedSession('room1', session);
			await clock.tickAsync(PRESENCE_LEASE_MS * 2);
			member('alice')!.lastSeenAt = new Date();

			await service.expirePresenceLeases(new Date());

			expect(member('bob')?.leftAt).to.be.undefined;
		});
	});

	describe('memberships running out', () => {
		it('forgets them and lets each session they were in follow, once', async () => {
			fixture = buildGroupCall([], { providerName: 'livekit', federation: session });
			memberships = [
				remoteMembership({ expiresAt: NOW }),
				remoteMembership({ _id: 'm-carol', uid: 'carol', expiresAt: new Date(NOW.getTime() - 1) }),
				remoteMembership({ _id: 'still-counts', uid: 'carol' }),
			];

			await service.expireFederatedMemberships(NOW);

			expect(MatrixRTCMembershipsMock.removeByIds.calledOnceWith(['membership-bob', 'm-carol'])).to.be.true;
			expect(MatrixRTCMembershipsMock.findActiveBySession.calledOnce).to.be.true;
		});

		it('does nothing when none ran out', async () => {
			memberships = [remoteMembership()];

			await service.expireFederatedMemberships(NOW);

			expect(MatrixRTCMembershipsMock.removeByIds.called).to.be.false;
		});
	});

	describe('ringing across servers', () => {
		const rings = () => broadcastStub.args.filter(([channel, payload]) => channel === 'user.video-conference' && payload.action === 'ring');

		it('rings the callee of a direct call on their own server when the caller arrives, after announcing the caller', async () => {
			room = { ...federatedRoom, t: 'd', uids: ['alice', 'bob'] };
			fixture = buildDirectCall([buildMember({ _id: 'bob', username: '@bob:remote.example.org', joined: false, joinedAt: undefined })], {
				providerName: 'livekit',
				status: VideoConferenceStatus.CALLING,
				createdBy: { _id: 'alice', username: 'alice', name: 'Alice' },
				federation: session,
			});

			await service.addUser('call1', 'alice');

			expect(FederationMatrixMock.notifyRTCSession.calledOnce).to.be.true;
			const [call, caller, targets, kind] = FederationMatrixMock.notifyRTCSession.firstCall.args;
			expect(call.federation).to.deep.equal(session);
			expect(caller).to.include({ _id: 'alice' });
			expect(targets.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['bob']);
			expect(kind).to.equal('ring');
			expect(FederationMatrixMock.joinRTCSession.calledBefore(FederationMatrixMock.notifyRTCSession)).to.be.true;
		});

		it('rings only the members of other servers there', async () => {
			fixture = buildGroupCall(
				[
					buildMember({ _id: 'alice' }),
					buildMember({ _id: 'bob', joined: false, joinedAt: undefined }),
					buildMember({ _id: 'dave', joined: false, joinedAt: undefined }),
				],
				{ providerName: 'livekit', federation: session },
			);

			await service.ringMember('alice', 'call1', 'bob');
			await service.ringMember('alice', 'call1', 'dave');

			expect(FederationMatrixMock.notifyRTCSession.calledOnce).to.be.true;
			expect(FederationMatrixMock.notifyRTCSession.firstCall.args[2].map(({ _id }: { _id: string }) => _id)).to.deep.equal(['bob']);
		});

		it('rings nobody elsewhere for a conference outside a federated room', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'alice' }), buildMember({ _id: 'bob', joined: false, joinedAt: undefined })], {
				providerName: 'livekit',
			});

			await service.ringMember('alice', 'call1', 'bob');

			expect(FederationMatrixMock.notifyRTCSession.called).to.be.false;
		});

		it('rings the users here a member of another server calls, as any ring does', async () => {
			fixture = buildDirectCall([buildMember({ _id: 'bob', federation: bobFederation })], {
				providerName: 'livekit',
				createdBy: { _id: 'bob', username: '@bob:remote.example.org', name: '@bob:remote.example.org' },
				federation: session,
			});

			await service.ringFromFederation('call1', 'bob', ['alice']);

			expect(member('alice')).to.include({ joined: false });
			expect(member('alice')?.ringingAt).to.be.instanceOf(Date);
			expect(rings().map(([, payload]) => payload.userId)).to.deep.equal(['alice']);
			expect(rings()[0][1].params).to.deep.equal({ callId: 'call1', rid: 'room1', uid: 'bob' });
			expect(FederationMatrixMock.notifyRTCSession.called).to.be.false;
		});

		it('does not ring again someone already in the call', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'bob', federation: bobFederation }), buildMember({ _id: 'alice' })], {
				providerName: 'livekit',
				federation: session,
			});

			await service.ringFromFederation('call1', 'bob', ['alice']);

			expect(rings()).to.be.empty;
		});

		it('turns down, on the caller server, the ring a user here declines', async () => {
			fixture = buildDirectCall([buildMember({ _id: 'bob', federation: bobFederation }), buildMember({ _id: 'alice', joined: false })], {
				providerName: 'livekit',
				federation: session,
			});

			await service.declineCall('alice', 'call1');

			expect(FederationMatrixMock.declineRTCSession.calledOnce).to.be.true;
			expect(FederationMatrixMock.declineRTCSession.firstCall.args[1]).to.include({ _id: 'alice' });
		});

		it('records a decline from another server without sending it back', async () => {
			fixture = buildDirectCall([buildMember({ _id: 'alice' }), buildMember({ _id: 'bob', joined: false })], {
				providerName: 'livekit',
				federation: session,
			});

			await service.declineCall('bob', 'call1');

			expect(member('bob')).to.include({ declined: true });
			expect(FederationMatrixMock.declineRTCSession.called).to.be.false;
		});
	});
});
