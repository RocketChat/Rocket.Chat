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
	SLOW_CONSUMER: 1013,

	TIMEOUT: 4000,
};

export const WS_ERRORS_MESSAGES = {
	CLOSE_PROTOCOL_ERROR: 'CLOSE_PROTOCOL_ERROR',
	UNSUPPORTED_DATA: 'UNSUPPORTED_DATA',
	SLOW_CONSUMER: 'SLOW_CONSUMER',
	TIMEOUT: 'TIMEOUT',
};

export const TIMEOUT = 1000 * 30; // 30 seconds

// Maximum bytes allowed in the WS send buffer before the client is considered a slow consumer
// and disconnected. Defaults to 4 MiB.
export const MAX_BUFFERED_BYTES = parseInt(process.env.DDP_MAX_BUFFERED_BYTES || '') || 4 * 1024 * 1024;
