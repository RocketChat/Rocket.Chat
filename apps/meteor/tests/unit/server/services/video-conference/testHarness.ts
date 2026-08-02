import type { IGroupVideoConference, IDirectVideoConference, IVideoConferenceUser } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

// The stubs below never vary between specs in this directory — they satisfy imports the service file needs
// at load time but that no test here actually exercises. Kept in one place so a new spec doesn't have to
// re-list all ~25 of them just to get the module to load; only the modules a spec actually cares about
// (`@rocket.chat/models`, `@rocket.chat/core-services`, and anything else under test) are assembled by the
// spec itself.
export const commonServiceStubs = {
	'@rocket.chat/apps': { Apps: {} },
	'@rocket.chat/logger': {
		Logger: class {
			error() {
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
