import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import { MeteorError } from '@rocket.chat/core-services';
import ejson from 'ejson';
import WebSocket from 'ws';

import { Server } from './Server';
import { Session } from './Session';
import { SERVER_ID, preframe } from './codec';
import { TIMEOUT, WS_ERRORS, WS_ERRORS_MESSAGES } from './constants';
import { ConnectionLifecycle } from './lifecycle';

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
		_sender: { sendFrame: jest.fn<void, [Buffer[], (err?: Error) => void]>((_frame, cb) => cb()) },
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

describe('Session', () => {
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

			const session = new Session(server, lifecycle, ws, false, makeRequest());

			expect(ws.send.mock.calls).toEqual([[SERVER_ID]]);
			expect(connected).toHaveBeenCalledWith(session);
		});

		it('greets SockJS clients with "o" and wraps every payload in a SockJS frame', () => {
			new Session(server, lifecycle, ws, true, makeRequest('/sockjs/123/abc/websocket'));

			expect(ws.send.mock.calls).toEqual([['o'], [`a${JSON.stringify([SERVER_ID])}`]]);
		});

		it('describes the connection with the session id, server instance id and request data', () => {
			const session = new Session(server, lifecycle, ws, false, makeRequest());

			expect(session.connection).toEqual({
				id: session.session,
				instanceId: server.id,
				onClose: expect.any(Function),
				clientAddress: '10.0.0.1',
				httpHeaders: { 'user-agent': 'jest' },
			});
		});

		it('replies with connected and the session id to a connect message', () => {
			const session = new Session(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect', version: '1', support: ['1'] });

			expect(sentPackets(ws)).toEqual([ejson.parse(SERVER_ID), { msg: 'connected', session: session.session }]);
		});

		it('closes with a protocol error when the first message is not connect', () => {
			new Session(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'ping' });

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
		});

		it('closes with unsupported data when a message cannot be parsed', () => {
			new Session(server, lifecycle, ws, false, makeRequest());

			receive(ws, 'not json');

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.UNSUPPORTED_DATA, WS_ERRORS_MESSAGES.UNSUPPORTED_DATA);
			expect(consoleError).toHaveBeenCalledTimes(1);
		});

		it('closes with unsupported data when a binary message arrives', () => {
			new Session(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect' }, true);

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.UNSUPPORTED_DATA, WS_ERRORS_MESSAGES.UNSUPPORTED_DATA);
			expect(consoleError).toHaveBeenCalledWith(expect.any(MeteorError));
		});

		it('closes with a protocol error when the socket errors', () => {
			new Session(server, lifecycle, ws, false, makeRequest());

			ws.emit('error', new Error('boom'));

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
			expect(consoleError).toHaveBeenCalledTimes(1);
		});
	});

	describe('dispatch', () => {
		let session: Session;

		beforeEach(() => {
			session = new Session(server, lifecycle, ws, false, makeRequest());
			receive(ws, { msg: 'connect' });
			ws.send.mockClear();
		});

		it('answers ping with pong carrying the same id', () => {
			receive(ws, { msg: 'ping', id: 'p1' });
			receive(ws, { msg: 'ping' });

			expect(sentPackets(ws)).toEqual([{ msg: 'pong', id: 'p1' }, { msg: 'pong' }]);
		});

		it('forwards a method call to the server bound to this session', async () => {
			const call = jest.spyOn(server, 'call').mockResolvedValue();
			const packet = { msg: 'method', id: 'm1', method: 'save', params: ['a'] };

			receive(ws, packet);
			await jest.runAllTimersAsync();

			expect(call).toHaveBeenCalledWith(session, packet);
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

		it('logs a rejected call and keeps dispatching the messages that follow it', async () => {
			const failure = new Error('socket write failed');
			const call = jest.spyOn(server, 'call').mockRejectedValueOnce(failure).mockResolvedValue();
			const subscribe = jest.spyOn(server, 'subscribe').mockResolvedValue();

			receive(ws, { msg: 'method', id: 'm1', method: 'failing' });
			receive(ws, { msg: 'sub', id: 's1', name: 'messages' });
			receive(ws, { msg: 'method', id: 'm2', method: 'next' });
			await jest.runAllTimersAsync();

			expect(call).toHaveBeenCalledTimes(2);
			expect(subscribe).toHaveBeenCalledTimes(1);
			expect(consoleError).toHaveBeenCalledWith('Error processing DDP message:', failure);
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
			session.subscriptions.set('s1', subscription);

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

	describe('pre-framed sends', () => {
		const frames = preframe('{"msg":"changed"}');

		it('writes the raw frame for websocket clients', async () => {
			const session = new Session(server, lifecycle, ws, false, makeRequest());

			await session.sendFrames(frames);

			expect(ws._sender.sendFrame).toHaveBeenCalledWith(frames.raw, expect.any(Function));
		});

		it('writes the SockJS frame for SockJS clients', async () => {
			const session = new Session(server, lifecycle, ws, true, makeRequest('/sockjs/1/a/websocket'));

			await session.sendFrames(frames);

			expect(ws._sender.sendFrame).toHaveBeenCalledWith(frames.sockjs, expect.any(Function));
		});

		it('rejects with the error the socket reports', async () => {
			const failure = Object.assign(new Error('destroyed'), { code: 'ERR_STREAM_DESTROYED' });
			ws._sender.sendFrame.mockImplementation((_frame, cb) => cb(failure));
			const session = new Session(server, lifecycle, ws, false, makeRequest());

			await expect(session.sendFrames(frames)).rejects.toBe(failure);
		});
	});

	describe('activity', () => {
		// Underscore's throttle reads the real clock, so only the collapsing of a burst is observable under fake timers.
		it('reports a burst of messages as a single activity event carrying the session', () => {
			const activity = jest.fn();
			lifecycle.on('activity', activity);
			const session = new Session(server, lifecycle, ws, false, makeRequest());

			receive(ws, { msg: 'connect' });
			receive(ws, { msg: 'ping' });
			receive(ws, { msg: 'ping' });

			expect(activity).toHaveBeenCalledTimes(1);
			expect(activity).toHaveBeenCalledWith(session);
		});
	});

	describe('idle timeout', () => {
		it('pings after the initial grace period and closes when the session stays silent', () => {
			new Session(server, lifecycle, ws, false, makeRequest());
			ws.send.mockClear();

			jest.advanceTimersByTime(TIMEOUT / 1000);

			expect(sentPackets(ws)).toEqual([{ msg: 'ping' }]);
			expect(ws.close).not.toHaveBeenCalled();

			jest.advanceTimersByTime(TIMEOUT);

			expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.TIMEOUT, WS_ERRORS_MESSAGES.TIMEOUT);
		});

		it('restarts the idle timer whenever a message arrives', () => {
			new Session(server, lifecycle, ws, false, makeRequest());
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
			const session = new Session(server, lifecycle, ws, false, makeRequest());
			const onClose = jest.fn();
			session.connection.onClose(onClose);
			session.subscriptions.set('s1', { stop: jest.fn() });

			ws.emit('close', 1000, 'bye');

			expect(disconnected).toHaveBeenCalledWith(session);
			expect(onClose).toHaveBeenCalledWith(1000, 'bye');
			expect(session.subscriptions.size).toBe(0);
		});

		it('stops the idle timer once the socket is closed', () => {
			new Session(server, lifecycle, ws, false, makeRequest());
			ws.send.mockClear();

			ws.emit('close');
			jest.advanceTimersByTime(TIMEOUT * 2);

			expect(ws.send).not.toHaveBeenCalled();
			expect(ws.close).not.toHaveBeenCalled();
		});
	});
});
