import type { IGroupVideoConference, IDirectVideoConference, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// The stubs below never vary between specs in this directory — they satisfy imports the service file needs
// at load time but that no test here actually exercises. Kept in one place so a new spec doesn't have to
// re-list all ~25 of them just to get the module to load; only the modules a spec actually cares about
// (`@rocket.chat/models`, `@rocket.chat/core-services`, and anything else under test) are assembled by the
// spec itself.
export const commonServiceStubs = {
	'@rocket.chat/apps': { Apps: {} },
	// Every level, not just `error`: a missing one throws where the service only meant to say something, and the
	// service catches around its logging — so the failure surfaces as the work silently not happening.
	'@rocket.chat/logger': {
		Logger: class {
			error() {
				/* no-op */
			}

			warn() {
				/* no-op */
			}

			info() {
				/* no-op */
			}

			debug() {
				/* no-op */
			}
		},
	},
	'@rocket.chat/random': { Random: { id: () => 'randomId' } },
	'@rocket.chat/tools': { wrapExceptions: (fn: () => unknown) => fn() },
	'meteor/meteor': { Meteor: { startup: () => undefined } },
	'meteor/mongo': { MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db: {} } }) } },
	'../../../definition/IRoomTypeConfig': { RoomMemberActions: {} },
	'../../../lib/videoConference/chatAccess': { resolveChatAccessMode: () => undefined },
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
};

/**
 * Loads the service with the stubs a spec actually cares about, and the inert ones filled in.
 *
 * Every spec here needs the same three things beyond `commonServiceStubs`: a `broadcast` it can read, the
 * do-nothing `ServiceClassInternal`/`Message`/`Room` the service calls into, and a `@rocket.chat/models` map with
 * only the collections that spec exercises. Nine copies of that arrangement is nine places to update when the
 * service reaches for one more module.
 *
 * @param broadcast the stub to observe `api.broadcast` through.
 * @param models the `@rocket.chat/models` collections this spec stubs; the rest default to inert.
 * @param overrides any other module to replace — where a spec is testing something `commonServiceStubs` fakes.
 */
export const createService = ({
	broadcast = sinon.stub().resolves(),
	models = {},
	overrides = {},
}: {
	broadcast?: sinon.SinonStub;
	models?: Record<string, unknown>;
	overrides?: Record<string, unknown>;
} = {}) => {
	const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
		...commonServiceStubs,
		'@rocket.chat/core-services': {
			api: { broadcast },
			ServiceClassInternal: class {
				onEvent() {
					/* no-op */
				}
			},
			Message: { saveSystemMessage: sinon.stub().resolves() },
			Room: { addUserToRoom: sinon.stub().resolves() },
		},
		'@rocket.chat/models': {
			Users: { findOneById: sinon.stub().resolves(null) },
			Rooms: { findOneById: sinon.stub().resolves(null) },
			Messages: { setBlocksById: sinon.stub().resolves() },
			Subscriptions: {
				findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
			},
			...models,
		},
		...overrides,
	});

	return VideoConfService as new () => any;
};

/**
 * Bare `sinon.stub()`s live outside sinon's default sandbox, so `sinon.resetHistory()` is a no-op for them —
 * each has to be reset by hand or a test would silently read the previous test's calls.
 */
export const resetAll = (...stubs: sinon.SinonStub[]): void => stubs.forEach((stub) => stub.resetHistory());

/**
 * A read of the fixture, as the database would answer it: a *copy*.
 *
 * `findOneById` is hit more than once per flow, with different projections, and the mutating model stubs write
 * into the canonical record. Handing out the live object would let a later write retroactively change what an
 * earlier read shows — which is exactly the staleness some of these flows depend on.
 */
export const cloneFixture = (call: VideoConference): VideoConference => ({
	...call,
	users: call.users.map((user) => ({ ...user })),
	messages: { ...call.messages },
});

/**
 * Who actually got rung: the `ring` notifications `notifyUser` sends via
 * `api.broadcast('user.video-conference', { userId, action, params })`, which is the only observable trace.
 */
export const ringedUserIds = (broadcast: sinon.SinonStub): string[] =>
	broadcast.args
		.filter(([channel, payload]) => channel === 'user.video-conference' && (payload as { action: string }).action === 'ring')
		.map(([, payload]) => (payload as { userId: string }).userId);

export const createdBy = { _id: 'creator', username: 'creator.user', name: 'Creator User' };

// A member's shape as it lives in `users[]`: someone who joined and is still in the call, unless overridden.
export const buildMember = (overrides: Partial<IVideoConferenceUser> & Pick<IVideoConferenceUser, '_id'>): IVideoConferenceUser => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	avatarETag: null,
	ts: new Date('2026-01-01T00:00:00.000Z'),
	joined: true,
	joinedAt: new Date('2026-01-01T00:00:00.000Z'),
	...overrides,
});

export const buildGroupCall = (users: IVideoConferenceUser[], overrides: Partial<IGroupVideoConference> = {}): IGroupVideoConference => ({
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

export const buildDirectCall = (
	users: IVideoConferenceUser[],
	overrides: Partial<IDirectVideoConference> = {},
): IDirectVideoConference => ({
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
