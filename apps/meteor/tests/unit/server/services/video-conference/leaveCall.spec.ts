import type { IGroupVideoConference, IDirectVideoConference, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// `VideoConference.findOneById` is hit more than once per `leaveCall` → `endCall` flow, with different
// projections (`leaveCall` reads `{ rid, users, endedAt }`, `endCall`'s `getUnfiltered` reads everything). A
// real DB would answer both from the same document, so `fixture` is the single canonical record and the
// mutating model methods below write into it, regardless of the projection asked for.
//
// Each read hands out a *clone*, not the live object. That matters for `endCall`: it reads the call, then
// writes `endedAt` onto the canonical record, and only afterwards checks `shouldWriteConferenceHistory(call)`
// against the variable it already had — deliberately stale, per the comment in the source. If reads returned
// the live object, that write would retroactively change what the earlier-read variable shows (objects are
// shared by reference), silently defeating the exact repeat-guard this suite is testing.
let fixture: VideoConference;

const cloneFixture = (): VideoConference => ({
	...fixture,
	users: fixture.users.map((user) => ({ ...user })),
	messages: { ...fixture.messages },
});

const VideoConferenceModelMock = {
	// `endCall`'s `getUnfiltered` is `VideoConfService.getUnfiltered`, which itself just calls
	// `VideoConference.findOneById(callId)` with no projection — there's no separate model method to stub.
	findOneById: sinon.stub().callsFake(async () => cloneFixture()),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).leftAt = leftAt;
		}
	}),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture, data);
	}),
	setStatusById: sinon.stub().callsFake(async (_callId: string, status: VideoConference['status']) => {
		fixture.status = status;
	}),
};

const CallHistoryMock = {
	insertMany: sinon.stub().resolves({ insertedCount: 0 }),
};

const UsersMock = {
	findOneById: sinon.stub().resolves(null),
};

const RoomsMock = {
	findOneById: sinon.stub().resolves(null),
};

const MessagesMock = {
	setBlocksById: sinon.stub().resolves(),
};

const SubscriptionsMock = {
	findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
};

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	'@rocket.chat/apps': { Apps: {} },
	'@rocket.chat/core-services': {
		api: { broadcast: sinon.stub().resolves() },
		ServiceClassInternal: class {
			onEvent() {
				/* no-op */
			}
		},
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Room: { addUserToRoom: sinon.stub().resolves() },
	},
	'@rocket.chat/logger': {
		Logger: class {
			error() {
				/* no-op */
			}
		},
	},
	'@rocket.chat/models': {
		CallHistory: CallHistoryMock,
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		Rooms: RoomsMock,
		Messages: MessagesMock,
		Subscriptions: SubscriptionsMock,
	},
	'@rocket.chat/random': { Random: { id: () => 'randomId' } },
	'@rocket.chat/tools': { wrapExceptions: (fn: () => unknown) => fn() },
	'meteor/meteor': { Meteor: { startup: () => undefined } },
	'meteor/mongo': { MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db: {} } }) } },
	'../../../definition/IRoomTypeConfig': { RoomMemberActions: {} },
	'../../../lib/videoConference/chatAccess': { resolveChatAccessMode: () => undefined },
	'../../../lib/videoConference/constants': { availabilityErrors: {}, shouldRingVideoConference: () => false },
	'../../database/readSecondaryPreferred': { readSecondaryPreferred: () => undefined },
	'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync: async () => true },
	'../../lib/callbacks': { callbacks: { runAsync: () => undefined, run: () => undefined } },
	'../../lib/i18n': { i18n: { t: (s: string) => s } },
	'../../lib/isRoomCompatibleWithVideoConfRinging': { isRoomCompatibleWithVideoConfRinging: () => true },
	'../../lib/media/assets': { RocketChatAssets: { getURL: () => '' } },
	'../../lib/messages/sendMessage': { sendMessage: async () => ({ _id: 'msg1' }) },
	'../../lib/metrics/lib/metrics': {
		metrics: { notificationsSent: { inc: () => undefined }, notificationsSentTotal: { inc: () => undefined } },
	},
	'../../lib/notifications/push/push': { Push: { send: async () => undefined } },
	'../../lib/notifications/push-config/lib/PushNotification': { default: { getNotificationId: () => 'notif' } },
	'../../lib/notifyListener': { notifyOnMessageChange: async () => undefined },
	'../../lib/rooms/createRoom': { createRoom: async () => ({ _id: 'room1' }) },
	'../../lib/rooms/roomCoordinator': {
		roomCoordinator: { getRoomDirectives: () => ({ allowMemberAction: async () => true, getDiscussionType: () => 'p' }) },
	},
	'../../lib/statistics/functions/updateStatsCounter': { updateCounter: () => undefined },
	'../../lib/utils/getUserAvatarURL': { getUserAvatarURL: () => '' },
	'../../lib/utils/lib/getUserPreference': { getUserPreference: async () => false },
	'../../lib/videoConfProviders': {
		videoConfProviders: {
			hasAnyProvider: () => false,
			getActiveProvider: () => undefined,
			isProviderAvailable: () => false,
			getProviderCapabilities: () => undefined,
			getProviderAppId: () => undefined,
			getProviderList: () => [],
		},
	},
	'../../lib/videoConfTypes': { videoConfTypes: { isCallManagedByApp: () => false, getTypeForRoom: () => ({}) } },
	'../../meteor-methods/rooms/addUsersToRoom': { addUsersToRoomMethod: async () => undefined },
	'../../settings': { settings: { get: () => undefined } },
});

const createdBy = { _id: 'creator', username: 'creator.user', name: 'Creator User' };

// A member's shape as it lives in `users[]`: someone who joined and is still in the call, unless overridden.
const buildMember = (overrides: Partial<IVideoConferenceUser> & Pick<IVideoConferenceUser, '_id'>): IVideoConferenceUser => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	avatarETag: null,
	ts: new Date('2026-01-01T00:00:00.000Z'),
	joined: true,
	joinedAt: new Date('2026-01-01T00:00:00.000Z'),
	...overrides,
});

const buildGroupCall = (users: IVideoConferenceUser[], overrides: Partial<IGroupVideoConference> = {}): IGroupVideoConference => ({
	_id: 'call1',
	type: 'videoconference',
	rid: 'room1',
	status: VideoConferenceStatus.STARTED,
	title: 'Sprint planning',
	anonymousUsers: 0,
	providerName: 'test',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	_updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	createdBy,
	messages: {},
	users,
	...overrides,
});

const buildDirectCall = (users: IVideoConferenceUser[], overrides: Partial<IDirectVideoConference> = {}): IDirectVideoConference => ({
	_id: 'call1',
	type: 'direct',
	rid: 'room1',
	status: VideoConferenceStatus.STARTED,
	providerName: 'test',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	_updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	createdBy,
	messages: {},
	users,
	...overrides,
});

describe('VideoConfService.leaveCall', () => {
	let service: InstanceType<typeof VideoConfService>;

	beforeEach(() => {
		service = new VideoConfService();
		// These are standalone stubs, so they are not in sinon's default sandbox and `sinon.resetHistory()`
		// would leave their call history intact — every assertion would then be reading the previous test's
		// calls, which is how a suite like this passes for the wrong reasons.
		[
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.setUserLeftById,
			VideoConferenceModelMock.setDataById,
			VideoConferenceModelMock.setStatusById,
			CallHistoryMock.insertMany,
		].forEach((stub) => stub.resetHistory());
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture());
		CallHistoryMock.insertMany.resolves({ insertedCount: 0 });
		SubscriptionsMock.findByRoomIdAndNotUserId.returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() });
	});

	// The reported bug: leaving the last-standing spot in a call must end it and leave every member a
	// history entry, not just silently mark the leaver as gone. `creator` already left earlier, so `other`
	// is genuinely the last one still in the call — this is what makes it "the last participant leaves"
	// rather than just "one of several leaves".
	it('ends the call and writes one history item per member when the last participant leaves', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'creator', leftAt: new Date('2026-01-01T00:30:00.000Z') }),
			buildMember({ _id: 'other' }),
		]);

		await service.leaveCall('other', 'call1');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
		expect(fixture.endedAt).to.be.instanceOf(Date);

		expect(CallHistoryMock.insertMany.calledOnce).to.be.true;
		const [items] = CallHistoryMock.insertMany.firstCall.args;
		expect(items).to.have.length(2);
		expect(items.map((item: { uid: string }) => item.uid).sort()).to.deep.equal(['creator', 'other']);
	});

	// Someone leaving while others remain must not end the call for them, and must not write history — the
	// call hasn't happened yet from those members' point of view.
	it('marks the member as left without ending the call when others remain', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'other' })]);

		await service.leaveCall('other', 'call1');

		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		expect(fixture.endedAt).to.be.undefined;

		const leaver = fixture.users.find((user) => user._id === 'other');
		expect(leaver?.leftAt).to.be.instanceOf(Date);

		expect(CallHistoryMock.insertMany.called).to.be.false;
	});

	// This was the specific case that produced nothing: a 1:1 DM conference has no `title` and was being
	// treated as out of scope for history, even though `shouldWriteConferenceHistory` says direct calls
	// belong in the log the same as group ones.
	it('writes history for a direct (1:1) conference when the last participant leaves', async () => {
		fixture = buildDirectCall([
			buildMember({ _id: 'creator', leftAt: new Date('2026-01-01T00:30:00.000Z') }),
			buildMember({ _id: 'other' }),
		]);

		await service.leaveCall('other', 'call1');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
		expect(CallHistoryMock.insertMany.calledOnce).to.be.true;

		const [items] = CallHistoryMock.insertMany.firstCall.args;
		expect(items).to.have.length(2);
		expect(items.every((item: { type: string }) => item.type === 'video-conference')).to.be.true;
		expect(items.some((item: { title?: string }) => 'title' in item)).to.be.false;
	});

	// A repeat `leaveCall` — or a provider resending the same "end" signal — must not collect a second
	// history entry per member.
	it('writes history at most once when the same member leaves twice', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'creator', leftAt: new Date('2026-01-01T00:30:00.000Z') }),
			buildMember({ _id: 'other' }),
		]);

		// The first call is the one that ends the conference; the second is either a duplicate client
		// action or a provider resending the same "left" signal — `leaveCall`'s own `call.endedAt` guard
		// must catch it before anything is written a second time.
		await service.leaveCall('other', 'call1');
		await service.leaveCall('other', 'call1');

		expect(CallHistoryMock.insertMany.calledOnce).to.be.true;
	});

	// A conference that already ended (already carries `endedAt`) must not be re-processed at all — this is
	// the guard `leaveCall` itself applies before touching anything.
	it('does not write history for a conference that already has endedAt', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'other', leftAt: new Date() })], {
			status: VideoConferenceStatus.ENDED,
			endedAt: new Date('2026-01-01T01:00:00.000Z'),
		});

		await service.leaveCall('creator', 'call1');

		expect(CallHistoryMock.insertMany.called).to.be.false;
		expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
	});

	// A member who was added to the conference but never joined (`joined: false`) has no active presence in
	// the call — they must not hold it open once the only member who actually joined leaves.
	it('ends the call when the leaver is the only joined member, even with an unjoined member still on the roster', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'neverJoined', joined: false, joinedAt: undefined })]);

		await service.leaveCall('creator', 'call1');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
		expect(CallHistoryMock.insertMany.calledOnce).to.be.true;

		const [items] = CallHistoryMock.insertMany.firstCall.args;
		expect(items).to.have.length(2);
		expect(items.find((item: { uid: string }) => item.uid === 'neverJoined')).to.include({ state: 'not-answered' });
		expect(items.find((item: { uid: string }) => item.uid === 'creator')).to.include({ state: 'ended' });
	});
});
