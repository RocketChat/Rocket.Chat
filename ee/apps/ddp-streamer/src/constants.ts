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
	SUBSCRIBE: 'sub',
	CONNECT: 'connect',
	CONNECTED: 'connected',
	SUBSCRIPTIONS: 'subs',
	NO_SUBSCRIBE: 'nosub',
	UNSUBSCRIBE: 'unsub',
	DISCONNECTED: 'disconnected',
	LOGGED: 'logged',
	LOGGEDOUT: 'loggedout',
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
