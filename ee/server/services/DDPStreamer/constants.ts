export const STREAMER_EVENTS = {
	STREAM: 'stream',
	USER_CHANGED: 'user-changed',
};

export const DDP_EVENTS = {
	ID: 'id',
	FIELDS: 'fields',
	COLLECTION: 'collection',
	CLEARED: 'cleared',
	METHODS: 'methods',

	MSG: 'msg',
	READY: 'ready',
	ADDED: 'added',
	CHANGED: 'changed',
	RESUME: 'resume',
	RESULT: 'result',
	METHOD: 'method',
	UPDATED: 'updated',
	PING: 'ping',
	PONG: 'pong',
	SUSBCRIBE: 'sub',
	CONNECT: 'connect',
	CONNECTED: 'connected',
	SUBSCRIPTIONS: 'subs',
	NO_SUBSCRIBE: 'nosub',
	UNSUBSCRIBE: 'unsub',
	DISCONNECTED: 'disconnected',
	LOGGED: 'logged',
};

export const WS_ERRORS = {
	CLOSE_PROTOCOL_ERROR: 1002,
	UNSUPPORTED_DATA: 1007,

	TIMEOUT: 4000,
};

export const WS_ERRORS_MESSAGES = {
	CLOSE_PROTOCOL_ERROR: 'CLOSE_PROTOCOL_ERROR',
	UNSUPPORTED_DATA: 'UNSUPPORTED_DATA',
	TIMEOUT: 'TIMEOUT',
};

export const TIMEOUT = 1000 * 30; // 30 seconds

export const STREAM_NAMES = {
	STREAMER_PREFIX: 'stream-',

	ROOMS_CHANGED: 'rooms-changed',
	ROOM_DATA: 'room-data', // TODO both data are the same plx merge them


	ROOM_MESSAGES: 'room-messages',
	NOTIFY_ALL: 'notify-all',
	NOTIFY_LOGGED: 'notify-logged',
	NOTIFY_ROOM: 'notify-room',
	NOTIFY_USER: 'notify-user',
	PRESENCE: 'userpresence',

	IMPORTERS: 'importers',
	ROLES: 'roles',
	APPS: 'apps',
	CANNED_RESPONSES: 'canned-responses',
	LIVECHAT_INQUIRY: 'livechat-inquiry-queue-observer',
	LIVECHAT_ROOM: 'livechat-room',

	NOTIFY_ROOM_USERS: 'notify-room-users',
	'my-message': '__my_messages__',
};
