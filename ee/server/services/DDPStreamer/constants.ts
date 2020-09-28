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
	REMOVED: 'removed',
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
	PRESENCE: 'userpresence',

	'my-message': '__my_messages__',
};
