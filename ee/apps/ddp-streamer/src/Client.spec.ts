import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import type WebSocket from 'ws';

import { Client } from './Client';
import { DDP_EVENTS, MAX_BUFFERED_BYTES, TIMEOUT, WS_ERRORS } from './constants';

jest.mock('./Server', () => ({ SERVER_ID: '{"msg":"server_id","server_id":"0"}' }));

jest.mock('./configureServer', () => {
	const realEvents: typeof import('events') = jest.requireActual('events');
	class FakeServer extends realEvents.EventEmitter {
		id = 'fake-server';

		serialize = (obj: unknown) => JSON.stringify(obj);

		parse = (data: any) => JSON.parse(data.toString());

		call = jest.fn().mockResolvedValue(undefined);

		subscribe = jest.fn().mockResolvedValue(undefined);
	}
	return { server: new FakeServer(), events: new realEvents.EventEmitter() };
});

jest.mock('@rocket.chat/core-services', () => ({
	Presence: { updateConnection: jest.fn().mockResolvedValue(undefined) },
}));

class FakeWebSocket extends EventEmitter {
	public bufferedAmount = 0;

	public readyState = 1;

	public send = jest.fn();

	public close = jest.fn((_code?: number, _reason?: string) => {
		this.readyState = 3;
	});
}

const makeReq = (): IncomingMessage => ({ socket: { remoteAddress: '127.0.0.1' }, headers: {} }) as unknown as IncomingMessage;

const asWs = (ws: FakeWebSocket): WebSocket => ws as unknown as WebSocket;

describe('Client.send backpressure', () => {
	let ws: FakeWebSocket;
	let client: any;

	beforeEach(() => {
		jest.useFakeTimers();
		ws = new FakeWebSocket();
		client = new Client(asWs(ws), false, makeReq());
		ws.send.mockClear();
		ws.close.mockClear();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	it('closes with code 1013 when bufferedAmount exceeds the threshold', () => {
		ws.bufferedAmount = MAX_BUFFERED_BYTES + 1;
		client.send('hello');
		expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.SLOW_CONSUMER, expect.any(String));
		expect(ws.send).not.toHaveBeenCalled();
	});

	it('forwards to ws.send when bufferedAmount is below the threshold', () => {
		ws.bufferedAmount = 1024;
		client.send('hello');
		expect(ws.send).toHaveBeenCalledWith('hello');
		expect(ws.close).not.toHaveBeenCalled();
	});

	it('encodes payloads for meteor clients with the SockJS array wrapper', () => {
		const meteorWs = new FakeWebSocket();
		const meteorClient = new Client(asWs(meteorWs), true, makeReq());
		meteorWs.send.mockClear();
		meteorClient.send('payload');
		expect(meteorWs.send).toHaveBeenCalledWith('a["payload"]');
	});
});

describe('Client heartbeat', () => {
	let ws: FakeWebSocket;

	const handshake = async (): Promise<void> => {
		ws.emit('message', Buffer.from(JSON.stringify({ msg: DDP_EVENTS.CONNECT, version: '1' })), false);
		await flushAsync();
	};

	const flushAsync = async (): Promise<void> => {
		// `Client.handler` is async — yield twice so server.parse, the internal emit, and
		// the once('message') listener all complete before the test inspects state.
		await Promise.resolve();
		await Promise.resolve();
	};

	beforeEach(() => {
		jest.useFakeTimers();
		ws = new FakeWebSocket();
		// Client wires itself into the ws via constructor side effects; we don't need the ref.
		void new Client(asWs(ws), false, makeReq());
		ws.send.mockClear();
		ws.close.mockClear();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	const lastSent = (): string | undefined => ws.send.mock.calls.at(-1)?.[0];

	it('sends PING after the idle window expires', () => {
		jest.advanceTimersByTime(TIMEOUT);
		expect(lastSent()).toContain(`"${DDP_EVENTS.PING}"`);
	});

	it('closes with code 4000 when no PONG arrives within the pong window', () => {
		jest.advanceTimersByTime(TIMEOUT); // PING sent, pong window starts
		jest.advanceTimersByTime(TIMEOUT); // pong window expires
		expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.TIMEOUT, expect.any(String));
	});

	it('does not extend the pong window when non-PONG traffic arrives', async () => {
		await handshake();
		ws.close.mockClear();
		jest.advanceTimersByTime(TIMEOUT); // PING sent
		ws.emit('message', Buffer.from(JSON.stringify({ msg: DDP_EVENTS.METHOD, method: 'foo', id: '1' })), false);
		await flushAsync();
		jest.advanceTimersByTime(TIMEOUT - 1);
		expect(ws.close).not.toHaveBeenCalled();
		jest.advanceTimersByTime(2);
		expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.TIMEOUT, expect.any(String));
	});

	it('cancels the pong window and resumes the idle cycle when PONG arrives', async () => {
		await handshake();
		ws.close.mockClear();
		jest.advanceTimersByTime(TIMEOUT); // PING #1 sent, pong window armed
		ws.send.mockClear();
		ws.emit('message', Buffer.from(JSON.stringify({ msg: DDP_EVENTS.PONG })), false);
		await flushAsync();
		// Past the original pong deadline — we should still be alive.
		jest.advanceTimersByTime(TIMEOUT);
		expect(ws.close).not.toHaveBeenCalled();
		// And the next idle window should have produced a fresh PING.
		expect(lastSent()).toContain(`"${DDP_EVENTS.PING}"`);
	});
});
