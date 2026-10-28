import WS from 'jest-websocket-mock';

import { handleConnection, handleConnectionAndRejects, handleMethod } from './helpers';
import { ConnectionImpl, getRetryDelay } from '../src/Connection';
import { MinimalDDPClient } from '../src/MinimalDDPClient';

// The Node build of the ws package, not the mock-socket stand-in from __mocks__ nor its browser build.
const { WebSocket: RealWebSocket } = jest.requireActual<typeof import('ws')>(
	require.resolve('ws/package.json').replace('package.json', 'index.js'),
);

let server: WS;
let connection: ConnectionImpl;
beforeEach(() => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	connection?.close();
	server.close();
	WS.clean();
	jest.useRealTimers();
});

it.each([
	[1, 50, 100],
	[2, 100, 200],
	[4, 400, 800],
	[20, 15_000, 30_000],
])('should wait between half and all of the backoff before attempt %i', (attempt, min, max) => {
	const random = jest.spyOn(Math, 'random');
	try {
		random.mockReturnValue(0);
		expect(getRetryDelay(100, attempt)).toBe(min);
		random.mockReturnValue(0.999999);
		expect(getRetryDelay(100, attempt)).toBeCloseTo(max, 0);
	} finally {
		random.mockRestore();
	}
});

it('should connect', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();
	await handleConnection(server, connection.connect());

	expect(connection.session).toBe('session');
	expect(connection.status).toBe('connected');
});

it('should handle a failing connection', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(handleConnectionAndRejects(server, connection.connect())).rejects.toBe('1');

	expect(connection.session).toBeUndefined();
	expect(connection.status).toBe('failed');
});

it('should reject connect() when the socket closes before the handshake', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const promise = connection.connect();
	await server.connected;
	await server.nextMessage;
	server.close();

	await expect(promise).rejects.toThrow('Connection closed before the DDP handshake completed');
	expect(connection.status).toBe('disconnected');
});

it('should emit connected once after a handshake that failed', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const failed = connection.connect();
	await server.connected;
	await server.nextMessage;
	server.close();
	await expect(failed).rejects.toThrow();

	WS.clean();
	server = new WS('ws://localhost:1234/websocket');
	const connected = jest.fn();
	connection.on('connected', connected);
	await handleConnection(server, connection.connect());

	expect(connected).toHaveBeenCalledTimes(1);
});

it('should reject connect() without crashing when the ws package cannot reach the server', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1', RealWebSocket as any, client, { retryCount: 0, retryTime: 0 });

	await expect(connection.connect()).rejects.toThrow();
	expect(connection.status).toBe('disconnected');
});

it('should reject connect() when the server is unreachable', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	await expect(connection.connect()).rejects.toThrow();
	expect(connection.status).toBe('disconnected');
});

it('should resolve whenConnected() once connected, and right away while connected', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const whenConnected = connection.whenConnected();
	const settled = jest.fn();
	void whenConnected.then(settled);
	const connecting = connection.connect();
	await server.connected;
	await Promise.resolve();
	expect(settled).not.toHaveBeenCalled();

	await handleConnection(server, connecting);

	await expect(whenConnected).resolves.toBeUndefined();
	await expect(connection.whenConnected()).resolves.toBeUndefined();
});

it('should reject whenConnected() when the connection is closed first', async () => {
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const whenConnected = connection.whenConnected();
	connection.close();

	await expect(whenConnected).rejects.toThrow('Connection closed before it was established');
});

it('should trigger a disconnect callback', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();
	const disconnectCallback = jest.fn();
	connection.on('connection', disconnectCallback);

	await handleConnection(server, connection.connect());

	expect(disconnectCallback).toHaveBeenNthCalledWith(1, 'connecting');
	expect(disconnectCallback).toHaveBeenNthCalledWith(2, 'connected');
	expect(disconnectCallback).toHaveBeenCalledTimes(2);
	server.close();
	expect(disconnectCallback).toHaveBeenCalledTimes(3);
	expect(disconnectCallback).toHaveBeenNthCalledWith(3, 'disconnected');
	expect(connection.status).toBe('disconnected');
});

it('should handle the close method', async () => {
	const client = new MinimalDDPClient();

	connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, {
		retryCount: 0,
		retryTime: 0,
	});

	server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		server.send('{"msg":"connected","session":"123"}');
	});

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(connection.connect()).resolves.toBe(true);

	expect(connection.session).toBe('123');
	expect(connection.status).toBe('connected');

	connection.close();

	expect(connection.status).toBe('closed');
});

it('should handle reconnecting', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: 1, retryTime: 100 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await handleConnection(server, connection.connect());

	expect(connection.session).toBe('session');
	expect(connection.status).toBe('connected');

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	expect(connection.status).toBe('disconnected');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(200),
		new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined))),
		new Promise((resolve) => {
			const handler = (status: string) => {
				if (status === 'connected') {
					connection.off('connection', handler);
					resolve(status);
				}
			};
			connection.on('connection', handler);
		}),
	);

	expect(connection.status).toBe('connected');
	jest.useRealTimers();
});

it('should keep reconnecting while the server stays down', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: Infinity, retryTime: 100 });

	await handleConnection(server, connection.connect());

	jest.useFakeTimers();

	server.close();
	WS.clean();

	// several attempts fail against no server at all
	await jest.advanceTimersByTimeAsync(5_000);
	expect(connection.retryCount).toBeGreaterThan(2);
	expect(connection.status).toBe('disconnected');

	server = new WS('ws://localhost:1234/websocket');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(60_000),
		new Promise((resolve) => {
			const handler = (status: string) => {
				if (status === 'connected') {
					connection.off('connection', handler);
					resolve(status);
				}
			};
			connection.on('connection', handler);
		}),
	);

	expect(connection.status).toBe('connected');
	expect(connection.retryCount).toBe(0);
});

it('should queue messages if the connection is not ready', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	connection.close();

	expect(connection.status).toBe('closed');

	client.emit('send', { msg: 'method', method: 'method', params: ['arg1', 'arg2'], id: '1' });

	expect(connection.queue.size).toBe(1);

	await handleConnection(server, connection.reconnect());

	expect(connection.queue.size).toBe(0);

	await handleMethod(server, 'method', ['arg1', 'arg2'], '1');
});

it('should be idempotent if reconnect is called while already connected', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	// Previous behavior was to throw "Connection in progress" — the consumer's
	// `void this.reconnect()` paths (notably the ws.onclose retry timer)
	// surfaced that as an unhandled rejection / pageError. Now a redundant
	// reconnect is just a no-op resolving with the current state.
	await expect(connection.reconnect()).resolves.toBe(true);
	expect(connection.status).toBe('connected');
});

it('should be idempotent if connect is called while already connected', async () => {
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	await expect(connection.connect()).resolves.toBe(true);
	expect(connection.status).toBe('connected');
});

it('should share the in-flight connect promise with a concurrent connect() caller', async () => {
	// Regression: while status === 'connecting', a second connect() used to
	// receive Promise.resolve(true) immediately, hiding any subsequent
	// 'failed' payload from the in-flight handshake. Both callers must now
	// observe the real outcome.
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const first = connection.connect();
	expect(connection.status).toBe('connecting');

	const second = connection.connect();
	expect(second).toBe(first);

	await expect(handleConnectionAndRejects(server, first, second)).rejects.toBe('1');
	expect(connection.status).toBe('failed');
});

it('should share the in-flight connect promise with a concurrent reconnect() caller', async () => {
	// Same as above for the reconnect() entry point — the ws.onclose retry
	// timer fires `reconnect()` and must piggyback on any handshake the
	// consumer's bootstrap path already started.
	const client = new MinimalDDPClient();
	connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const first = connection.connect();
	expect(connection.status).toBe('connecting');

	const second = connection.reconnect();
	expect(second).toBe(first);

	await handleConnection(server, first, second);
	expect(connection.status).toBe('connected');
});

it('should not surface the retry timer rejection when an external connect won the race', async () => {
	// Regression: ws.onclose schedules a `void this.reconnect()` timer; if the
	// consumer (e.g. ddpSdk.ts startConnect) opens a fresh socket before that
	// timer fires, the timer used to reject with "Connection in progress" and,
	// because of the leading `void`, the rejection became an unhandled
	// rejection on the page. The timer must now no-op silently when the
	// connection has already been re-established.
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: 1, retryTime: 100 });

	await handleConnection(server, connection.connect());
	expect(connection.status).toBe('connected');

	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	expect(connection.status).toBe('disconnected');

	// Track unhandled rejections on the timer's promise.
	const unhandled = jest.fn();
	process.on('unhandledRejection', unhandled);

	// External code opens a new connection BEFORE the retry timer fires.
	const externalConnect = handleConnection(server, connection.connect());

	// Run the timer.
	await jest.advanceTimersByTimeAsync(200);
	await externalConnect;

	// Drain any microtasks the timer might have queued.
	await Promise.resolve();
	await Promise.resolve();

	expect(connection.status).toBe('connected');
	expect(unhandled).not.toHaveBeenCalled();
	process.off('unhandledRejection', unhandled);
	jest.useRealTimers();
});

it('should reset retryCount on a successful connection so subsequent drops can retry', async () => {
	// Regression: retryCount was only ever incremented on disconnect, never
	// zeroed on successful (re)connect. With default retryCount=1 budget, a
	// single force-logout cycle (server close → SDK reconnects → app calls
	// `Meteor.logout()` → server's logout handler closes WS again) drained the
	// budget, and the second close left the SDK permanently disconnected.
	// Method frames queued on the SDK during that window stayed queued
	// forever — observed in e2e-encryption/e2ee-passphrase-management as the
	// next loginByUserState login frame never being delivered.
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: 1, retryTime: 100 });

	await handleConnection(server, connection.connect());
	expect(connection.status).toBe('connected');
	expect((connection as unknown as { retryCount: number }).retryCount).toBe(0);

	// First disconnect → schedules retry (retryCount: 0 → 1).
	jest.useFakeTimers();
	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	expect(connection.status).toBe('disconnected');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(200),
		new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined))),
		new Promise((resolve) => {
			const handler = (status: string) => {
				if (status === 'connected') {
					connection.off('connection', handler);
					resolve(status);
				}
			};
			connection.on('connection', handler);
		}),
	);
	jest.useRealTimers();
	expect(connection.status).toBe('connected');

	// Successful reconnect must zero the retry budget.
	expect((connection as unknown as { retryCount: number }).retryCount).toBe(0);

	// Second disconnect should still schedule a retry now that the budget reset.
	jest.useFakeTimers();
	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(200),
		new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined))),
		new Promise((resolve) => {
			const handler = (status: string) => {
				if (status === 'connected') {
					connection.off('connection', handler);
					resolve(status);
				}
			};
			connection.on('connection', handler);
		}),
	);
	jest.useRealTimers();
	expect(connection.status).toBe('connected');
	// Two full reconnect cycles over real-time mock-socket handshakes can
	// exceed the default 5s on a loaded CI runner.
}, 15000);

it('should ignore a stale ws.onclose that fires after the socket has been replaced', async () => {
	// Regression: ws.onclose handlers were closed over the original ws but
	// mutated `this.status`/`this.retryCount` unconditionally. If a late close
	// event from an old socket arrives after a new socket is connected, the
	// handler would flip status back to 'disconnected' and schedule another
	// retry timer.
	const client = new MinimalDDPClient();
	connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: 1, retryTime: 100 });

	await handleConnection(server, connection.connect());
	const firstWs = (connection as unknown as { ws: WebSocket }).ws;
	expect(connection.status).toBe('connected');

	jest.useFakeTimers();
	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	expect(connection.status).toBe('disconnected');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(200),
		new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined))),
		new Promise((resolve) => {
			const handler = (status: string) => {
				if (status === 'connected') {
					connection.off('connection', handler);
					resolve(status);
				}
			};
			connection.on('connection', handler);
		}),
	);

	expect(connection.status).toBe('connected');
	jest.useRealTimers();
	const secondWs = (connection as unknown as { ws: WebSocket }).ws;
	expect(secondWs).not.toBe(firstWs);

	const statusBefore = connection.status;
	const retryBefore = (connection as unknown as { retryCount: number }).retryCount;

	// Synthesize a late `close` event on the original socket — the handler
	// must short-circuit because `this.ws !== ws` for the closed-over ws.
	(firstWs as unknown as { onclose?: () => void }).onclose?.();

	expect(connection.status).toBe(statusBefore);
	expect((connection as unknown as { retryCount: number }).retryCount).toBe(retryBefore);
});
