import { DDP_EVENTS, TIMEOUT, WS_ERRORS, WS_ERRORS_MESSAGES } from './constants';

describe('protocol constants', () => {
	it('preserves DDP message and field names', () => {
		expect(DDP_EVENTS).toEqual({
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
		});
	});

	it('preserves WebSocket close codes and their associated messages', () => {
		expect(WS_ERRORS).toEqual({ CLOSE_PROTOCOL_ERROR: 1002, UNSUPPORTED_DATA: 1007, TIMEOUT: 4000 });
		expect(WS_ERRORS_MESSAGES).toEqual({
			CLOSE_PROTOCOL_ERROR: 'CLOSE_PROTOCOL_ERROR',
			UNSUPPORTED_DATA: 'UNSUPPORTED_DATA',
			TIMEOUT: 'TIMEOUT',
		});
	});

	it('uses a thirty-second connection timeout in milliseconds', () => {
		expect(TIMEOUT).toBe(30_000);
	});
});
