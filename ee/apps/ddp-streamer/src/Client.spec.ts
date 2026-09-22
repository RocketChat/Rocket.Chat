import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import { MeteorError, Presence } from '@rocket.chat/core-services';
import ejson from 'ejson';
import WebSocket from 'ws';

import { Client } from './Client';
import { SERVER_ID, Server } from './Server';
import { TIMEOUT, WS_ERRORS, WS_ERRORS_MESSAGES } from './constants';
import { ConnectionLifecycle } from './lifecycle';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Presence: {
		updateConnection: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

function makeSocket(readyState: number = WebSocket.OPEN) {
	const socket = Object.assign(new EventEmitter(), {
		readyState,
		send: jest.fn<void, [string]>(),
		close: jest.fn<void, [number?, string?]>(),
	});

	return socket as typeof socket & WebSocket;
}

function makeRequest(url = '/websocket'): IncomingMessage {
	return {
		url,
		headers: { 'user-agent': 'jest' },
		socket: { remoteAddress: '10.0.0.1' },
	} as unknown as IncomingMessage;
}

function receive(ws: ReturnType<typeof makeSocket>, packet: object | string, isBinary = false): void {
	ws.emit('message', typeof packet === 'string' ? packet : ejson.stringify(packet), isBinary);
}

function sentPackets(ws: ReturnType<typeof makeSocket>) {
	return ws.send.mock.calls.map(([payload]) => ejson.parse(payload));
}

describe('Client', () => {
	let server: Server;
	let lifecycle: ConnectionLifecycle;
	let ws: ReturnType<typeof makeSocket>;
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		server = new Server();
		lifecycle = new ConnectionLifecycle();
		ws = makeSocket();
	});

	afterEach(() => {
		consoleError.mockRestore();
		jest.useRealTimers();
	});

	describe('handshake', () => {
		it('sends the server id and announces the connection without any greeting for websocket clients', () => {
			const connected = jest.fn();
			lifecycle.on('connected', connected);

			const client = new Client(server, lifecycle, ws, false, makeRequest());

			expect(ws.send.mock.calls).toEqual([[SERVER_ID]]);
			expect(connected).toHaveBeenCalledWith(client);
		});

		it('greets SockJS clients with "o" and wraps every payload in a SockJS frame', () => {
			new Client(server, lifecycle, ws, true, makeRequest('/sockjs/123/abc/websocket'));

			expect(ws.send.mock.calls).toEqual([['o'], [`a${JSON.stringify([SERVER_ID])}`]]);
		});

		it('describes the connection with the session id, server instance id and request data', () => {
			const client = new Client(server, lifecycle, ws, false, makeRequest());

			expect(client.connection).toEqual({
				id: client.session,
				instanceId: server.id,
				onClose: expect.any(Function),
				clientAddress: '10.0.0.1',
				httpHeaders: { 'user-agent': 'jest' },
			});
		});

		it('replies with connected and the session id to a connect message', () => {
			const client = new Client(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect', version: '1', support: ['1'] });

			expect(sentPackets(ws)).toEqual([ejson.parse(SERVER_ID), { msg: 'connected', session: client.session }]);
		});

		it('closes with a protocol error when the first message is not connect', () => {
			new Client(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'ping' });

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
		});

		it('closes with unsupported data when a message cannot be parsed', () => {
			new Client(server, lifecycle, ws, false, makeRequest());

			receive(ws, 'not json');

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.UNSUPPORTED_DATA, WS_ERRORS_MESSAGES.UNSUPPORTED_DATA);
			expect(consoleError).toHaveBeenCalledTimes(1);
		});

		it('closes with unsupported data when a binary message arrives', () => {
			new Client(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect' }, true);

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.UNSUPPORTED_DATA, WS_ERRORS_MESSAGES.UNSUPPORTED_DATA);
			expect(consoleError).toHaveBeenCalledWith(expect.any(MeteorError));
		});

		it('closes with a protocol error when the socket errors', () => {
			new Client(server, lifecycle, ws, false, makeRequest());

			ws.emit('error', new Error('boom'));

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
			expect(consoleError).toHaveBeenCalledTimes(1);
		});
	});

	describe('dispatch', () => {
		let client: Client;

		beforeEach(() => {
			client = new Client(server, lifecycle, ws, false, makeRequest());
			receive(ws, { msg: 'connect' });
			ws.send.mockClear();
		});

		it('answers ping with pong carrying the same id', () => {
			receive(ws, { msg: 'ping', id: 'p1' });
			receive(ws, { msg: 'ping' });

			expect(sentPackets(ws)).toEqual([{ msg: 'pong', id: 'p1' }, { msg: 'pong' }]);
		});

		it('forwards a method call to the server bound to this client', async () => {
			const call = jest.spyOn(server, 'call').mockResolvedValue();
			const packet = { msg: 'method', id: 'm1', method: 'save', params: ['a'] };

			receive(ws, packet);
			await jest.runAllTimersAsync();

			expect(call).toHaveBeenCalledWith(client, packet);
		});

		it('runs method and subscription calls one at a time in arrival order', async () => {
			const order: string[] = [];
			let finishFirst!: () => void;
			jest.spyOn(server, 'call').mockImplementation(async (_client, packet) => {
				order.push(`start ${packet.id}`);
				if (packet.id === 'm1') {
					await new Promise<void>((resolve) => {
						finishFirst = resolve;
					});
				}
				order.push(`end ${packet.id}`);
			});
			jest.spyOn(server, 'subscribe').mockImplementation(async (_client, packet) => {
				order.push(`sub ${packet.id}`);
			});

			receive(ws, { msg: 'method', id: 'm1', method: 'slow' });
			receive(ws, { msg: 'sub', id: 's1', name: 'messages' });
			receive(ws, { msg: 'method', id: 'm2', method: 'fast' });
			await jest.runAllTimersAsync();

			expect(order).toEqual(['start m1']);

			finishFirst();
			await jest.runAllTimersAsync();

			expect(order).toEqual(['start m1', 'end m1', 'sub s1', 'start m2', 'end m2']);
		});

		it.each([
			['method without name', { msg: 'method', id: 'm1' }],
			['method without id', { msg: 'method', method: 'save' }],
			['sub without name', { msg: 'sub', id: 's1' }],
			['sub without id', { msg: 'sub', name: 'messages' }],
			['unsub without id', { msg: 'unsub' }],
		])('closes with a protocol error on a %s', (_name, packet) => {
			jest.spyOn(server, 'call');
			jest.spyOn(server, 'subscribe');

			receive(ws, packet);

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
			expect(server.call).not.toHaveBeenCalled();
			expect(server.subscribe).not.toHaveBeenCalled();
		});

		it('stops the matching subscription on unsub and ignores unknown ids', () => {
			const subscription = { stop: jest.fn() };
			client.subscriptions.set('s1', subscription);

			receive(ws, { msg: 'unsub', id: 'unknown' });
			receive(ws, { msg: 'unsub', id: 's1' });

			expect(subscription.stop).toHaveBeenCalledTimes(1);
			expect(ws.close).not.toHaveBeenCalled();
		});

		it('ignores unknown message types', () => {
			receive(ws, { msg: 'something-else' });

			expect(ws.send).not.toHaveBeenCalled();
			expect(ws.close).not.toHaveBeenCalled();
		});
	});

	describe('presence heartbeat', () => {
		it('reports a burst of messages from a logged in client as a single activity update', () => {
			const client = new Client(server, lifecycle, ws, false, makeRequest());
			client.userId = 'user1';

			receive(ws, { msg: 'connect' });
			receive(ws, { msg: 'ping' });
			receive(ws, { msg: 'ping' });

			expect(Presence.updateConnection).toHaveBeenCalledTimes(1);
			expect(Presence.updateConnection).toHaveBeenCalledWith('user1', client.connection.id);
		});

		it('does not report activity for anonymous clients', () => {
			new Client(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect' });

			expect(Presence.updateConnection).not.toHaveBeenCalled();
		});
	});

	describe('idle timeout', () => {
		it('pings after the initial grace period and closes when the client stays silent', () => {
			new Client(server, lifecycle, ws, false, makeRequest());
			ws.send.mockClear();

			jest.advanceTimersByTime(TIMEOUT / 1000);

			expect(sentPackets(ws)).toEqual([{ msg: 'ping' }]);
			expect(ws.close).not.toHaveBeenCalled();

			jest.advanceTimersByTime(TIMEOUT);

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.TIMEOUT, WS_ERRORS_MESSAGES.TIMEOUT);
		});

		it('restarts the idle timer whenever a message arrives', () => {
			new Client(server, lifecycle, ws, false, makeRequest());
			receive(ws, { msg: 'connect' });
			ws.send.mockClear();

			jest.advanceTimersByTime(TIMEOUT - 1);

			expect(ws.send).not.toHaveBeenCalled();

			receive(ws, { msg: 'ping' });
			ws.send.mockClear();
			jest.advanceTimersByTime(TIMEOUT - 1);

			expect(ws.send).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);

			expect(sentPackets(ws)).toEqual([{ msg: 'ping' }]);
		});
	});

	describe('close', () => {
		it('announces the disconnection, runs onClose callbacks, and clears subscriptions', () => {
			const disconnected = jest.fn();
			lifecycle.on('disconnected', disconnected);
			const client = new Client(server, lifecycle, ws, false, makeRequest());
			const onClose = jest.fn();
			client.connection.onClose(onClose);
			client.subscriptions.set('s1', { stop: jest.fn() });

			ws.emit('close', 1000, 'bye');

			expect(disconnected).toHaveBeenCalledWith(client);
			expect(onClose).toHaveBeenCalledWith(1000, 'bye');
			expect(client.subscriptions.size).toBe(0);
		});

		it('stops the idle timer once the socket is closed', () => {
			new Client(server, lifecycle, ws, false, makeRequest());
			ws.send.mockClear();

			ws.emit('close');
			jest.advanceTimersByTime(TIMEOUT * 2);

			expect(ws.send).not.toHaveBeenCalled();
			expect(ws.close).not.toHaveBeenCalled();
		});
	});
});
