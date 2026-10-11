import { EventEmitter } from 'events';

import ejson from 'ejson';
import WebSocket from 'ws';

import type { IPacket } from '../ddp/IPacket';
import type { Publication } from '../ddp/Publication';
import type { Session } from '../ddp/Session';

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

export function makeSubscription(name = 'messages'): IPacket {
	return { ...makePacket(''), msg: 'sub', name, params: ['room1', { useCollection: true }] };
}

export function sentPackets(session: ReturnType<typeof makeSession>) {
	return session.send.mock.calls.map(([payload]) => ejson.parse(payload));
}
