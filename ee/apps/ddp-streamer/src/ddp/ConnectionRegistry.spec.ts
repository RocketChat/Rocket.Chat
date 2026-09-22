import { EventEmitter } from 'events';

import WebSocket from 'ws';

import type { Client } from './Client';
import { ConnectionRegistry } from './ConnectionRegistry';
import { ConnectionLifecycle } from './lifecycle';

function makeClient(userId: string | undefined, sessionId: string) {
	const ws = Object.assign(new EventEmitter(), {
		readyState: WebSocket.OPEN as number,
		close: jest.fn(),
		terminate: jest.fn(),
	});

	return { userId, connection: { id: sessionId }, ws } as unknown as Client & { ws: typeof ws };
}

describe('ConnectionRegistry', () => {
	let lifecycle: ConnectionLifecycle;
	let registry: ConnectionRegistry;

	beforeEach(() => {
		jest.useFakeTimers();
		lifecycle = new ConnectionLifecycle();
		registry = new ConnectionRegistry(lifecycle);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('counts clients from connection until disconnection', () => {
		const first = makeClient('user1', 's1');
		const second = makeClient('user2', 's2');

		lifecycle.emit('connected', first);
		lifecycle.emit('connected', second);
		expect(registry.size).toBe(2);

		lifecycle.emit('disconnected', first);
		lifecycle.emit('disconnected', first);
		expect(registry.size).toBe(1);
	});

	describe('closeSession', () => {
		it('closes only the socket of the named session, whoever owns it, and never terminates', () => {
			const target = makeClient('user1', 's1');
			const sameUser = makeClient('user1', 's2');
			lifecycle.emit('connected', target);
			lifecycle.emit('connected', sameUser);

			registry.closeSession('s1');
			jest.advanceTimersByTime(10_000);

			expect(target.ws.close).toHaveBeenCalledTimes(1);
			expect(target.ws.terminate).not.toHaveBeenCalled();
			expect(sameUser.ws.close).not.toHaveBeenCalled();
		});
	});

	describe('closeForUser', () => {
		it('closes every socket of the user and leaves other users alone', () => {
			const first = makeClient('user1', 's1');
			const second = makeClient('user1', 's2');
			const other = makeClient('user2', 's3');
			const anonymous = makeClient(undefined, 's4');
			[first, second, other, anonymous].forEach((client) => lifecycle.emit('connected', client));

			registry.closeForUser('user1');

			expect(first.ws.close).toHaveBeenCalledTimes(1);
			expect(second.ws.close).toHaveBeenCalledTimes(1);
			expect(other.ws.close).not.toHaveBeenCalled();
			expect(anonymous.ws.close).not.toHaveBeenCalled();
		});

		// Queued frames such as the force_logout stream message need the graceful close to be delivered;
		// the guard only exists for sockets that never finish the closing handshake.
		it('terminates a socket that has not closed after the grace period and spares those that did', () => {
			const stuck = makeClient('user1', 's1');
			const closing = makeClient('user1', 's2');
			const alreadyClosed = makeClient('user1', 's3');
			[stuck, closing, alreadyClosed].forEach((client) => lifecycle.emit('connected', client));

			registry.closeForUser('user1');
			closing.ws.emit('close');
			alreadyClosed.ws.readyState = WebSocket.CLOSED;
			jest.advanceTimersByTime(4999);

			expect(stuck.ws.terminate).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);

			expect(stuck.ws.terminate).toHaveBeenCalledTimes(1);
			expect(closing.ws.terminate).not.toHaveBeenCalled();
			expect(alreadyClosed.ws.terminate).not.toHaveBeenCalled();
		});
	});

	it('terminates every connected socket on terminateAll', () => {
		const first = makeClient('user1', 's1');
		const gone = makeClient('user2', 's2');
		lifecycle.emit('connected', first);
		lifecycle.emit('connected', gone);
		lifecycle.emit('disconnected', gone);

		registry.terminateAll();

		expect(first.ws.terminate).toHaveBeenCalledTimes(1);
		expect(gone.ws.terminate).not.toHaveBeenCalled();
	});
});
