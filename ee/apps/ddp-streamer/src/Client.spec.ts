import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import ejson from 'ejson';
import WebSocket from 'ws';

import { Client } from './Client';
import { Server } from './Server';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	MeteorService: {
		getLoginServiceConfiguration: jest.fn().mockResolvedValue([]),
	},
	Presence: {
		updateConnection: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

function makeSocket() {
	const socket = Object.assign(new EventEmitter(), {
		readyState: WebSocket.OPEN,
		send: jest.fn<void, [string]>(),
		close: jest.fn<void, [number?, string?]>(),
	});

	return socket as typeof socket & WebSocket;
}

function makeRequest(): IncomingMessage {
	return { url: '/websocket', headers: {}, socket: { remoteAddress: '10.0.0.1' } } as unknown as IncomingMessage;
}

function receive(ws: ReturnType<typeof makeSocket>, packet: object): void {
	ws.emit('message', ejson.stringify(packet), false);
}

describe('Client dispatch', () => {
	const server = new Server();
	let ws: ReturnType<typeof makeSocket>;
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		jest.restoreAllMocks();
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		ws = makeSocket();
		new Client(server, ws, false, makeRequest());
		receive(ws, { msg: 'connect', version: '1', support: ['1'] });
	});

	afterEach(() => {
		ws.emit('close');
		consoleError.mockRestore();
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
		await new Promise(setImmediate);

		expect(order).toEqual(['start m1']);

		finishFirst();
		await new Promise(setImmediate);

		expect(order).toEqual(['start m1', 'end m1', 'sub s1', 'start m2', 'end m2']);
	});

	it('logs a rejected call and keeps dispatching the messages that follow it', async () => {
		const failure = new Error('socket write failed');
		const call = jest.spyOn(server, 'call').mockRejectedValueOnce(failure).mockResolvedValue();
		const subscribe = jest.spyOn(server, 'subscribe').mockResolvedValue();

		receive(ws, { msg: 'method', id: 'm1', method: 'failing' });
		receive(ws, { msg: 'sub', id: 's1', name: 'messages' });
		receive(ws, { msg: 'method', id: 'm2', method: 'next' });
		await new Promise(setImmediate);

		expect(call).toHaveBeenCalledTimes(2);
		expect(subscribe).toHaveBeenCalledTimes(1);
		expect(consoleError).toHaveBeenCalledWith('Error processing DDP message:', failure);
	});
});
