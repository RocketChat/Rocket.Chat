import { EventEmitter } from 'events';

import type { IPacket, Publication, Session } from '@rocket.chat/ddp-server';
import ejson from 'ejson';
import WebSocket from 'ws';

export function makeSession(readyState: number = WebSocket.OPEN) {
	const session = Object.assign(new EventEmitter(), {
		ws: { readyState, close: jest.fn<void, [number?, string?]>() },
		userId: 'user1' as string | undefined,
		userToken: 'token1',
		connection: { id: 'connection1' },
		subscriptions: new Map<string, Publication>(),
		send: jest.fn<void, [string]>(),
	});

	return session as typeof session & Session;
}

export function makePacket(method: string, id = 'test-id'): IPacket {
	return { msg: 'method', method, id, params: [], name: '', version: '1', support: ['1'] };
}

export function sentPackets(session: ReturnType<typeof makeSession>) {
	return session.send.mock.calls.map(([payload]) => ejson.parse(payload));
}
