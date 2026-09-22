import { EventEmitter } from 'events';

import ejson from 'ejson';
import WebSocket from 'ws';

import type { Client } from '../Client';
import type { Publication } from '../Publication';
import type { IPacket } from '../types/IPacket';

export function makeClient(readyState: number = WebSocket.OPEN) {
	const client = Object.assign(new EventEmitter(), {
		ws: { readyState, close: jest.fn<void, [number?, string?]>() },
		userId: 'user1' as string | undefined,
		userToken: 'token1',
		connection: { id: 'connection1' },
		subscriptions: new Map<string, Publication>(),
		send: jest.fn<void, [string]>(),
	});

	return client as typeof client & Client;
}

export function makePacket(method: string, id = 'test-id'): IPacket {
	return { msg: 'method', method, id, params: [], name: '', version: '1', support: ['1'] };
}

export function makeSubscription(name = 'messages'): IPacket {
	return { ...makePacket(''), msg: 'sub', name, params: ['room1', { useCollection: true }] };
}

export function sentPackets(client: ReturnType<typeof makeClient>) {
	return client.send.mock.calls.map(([payload]) => ejson.parse(payload));
}
