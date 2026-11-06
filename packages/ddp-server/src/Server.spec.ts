import type { IServiceMetrics } from '@rocket.chat/core-services';
import { ClientSafeError } from '@rocket.chat/core-services';
import WebSocket from 'ws';

import { Publication } from './Publication';
import type { RemoteMethodCall } from './Server';
import { Server } from './Server';
import { makeSession, makePacket, makeSubscription, sentPackets } from './__tests__/helpers';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const remoteCall = jest.fn<ReturnType<RemoteMethodCall>, Parameters<RemoteMethodCall>>();

describe('Server method contracts', () => {
	let server: Server;
	let session: ReturnType<typeof makeSession>;

	beforeEach(() => {
		jest.clearAllMocks();
		remoteCall.mockReset();
		server = new Server(remoteCall);
		session = makeSession();
	});

	it('registers multiple methods and retains the original when a name is duplicated', async () => {
		const first = jest.fn().mockReturnValue('first result');
		const second = jest.fn().mockResolvedValue('second result');
		const replacement = jest.fn();
		server.methods({ first, second });
		server.methods({ first: replacement });

		await server.call(session, makePacket('first', 'm1'));
		await server.call(session, makePacket('second', 'm2'));

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(replacement).not.toHaveBeenCalled();
		expect(remoteCall).not.toHaveBeenCalled();
		expect(sentPackets(session)).toEqual([
			{ msg: 'result', id: 'm1', result: 'first result' },
			{ msg: 'updated', methods: ['m1'] },
			{ msg: 'result', id: 'm2', result: 'second result' },
			{ msg: 'updated', methods: ['m2'] },
		]);
	});

	it('forwards parameters and binds the local method to the session', async () => {
		const method = jest.fn().mockResolvedValue({ saved: true });
		server.methods({ save: method });
		const packet = { ...makePacket('save'), params: ['room1', { text: 'hello' }] };

		await server.call(session, packet);

		expect(method).toHaveBeenCalledWith('room1', { text: 'hello' });
		expect(method.mock.contexts).toEqual([session]);
		expect(sentPackets(session)).toEqual([
			{ msg: 'result', id: 'test-id', result: { saved: true } },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('forwards the session and parameters to the remote call and sends its result', async () => {
		remoteCall.mockResolvedValue('remote result');
		const packet = { ...makePacket('remote'), params: ['room1', 42] };

		await server.call(session, packet);

		expect(remoteCall).toHaveBeenCalledWith(session, 'remote', ['room1', 42]);
		expect(sentPackets(session)).toEqual([
			{ msg: 'result', id: 'test-id', result: 'remote result' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('sends result and updated when a local method returns void', async () => {
		const method = jest.fn();
		server.methods({ save: method });

		await server.call(session, makePacket('save'));

		expect(method).toHaveBeenCalledTimes(1);
		expect(sentPackets(session)).toEqual([
			{ msg: 'result', id: 'test-id' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('sends result and updated when a remote method returns void', async () => {
		remoteCall.mockResolvedValue(undefined);

		await server.call(session, makePacket('setAvatarFromService'));

		expect(sentPackets(session)).toEqual([
			{ msg: 'result', id: 'test-id' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	describe.each(['local', 'remote'] as const)('%s failures', (source) => {
		it.each([
			[
				'expected error',
				new ClientSafeError(403, 'Forbidden', { permission: 'view-room' }),
				new ClientSafeError(403, 'Forbidden', { permission: 'view-room' }).toJSON(),
			],
			['unexpected error', new Error('private database details'), new ClientSafeError(500, 'Internal server error').toJSON()],
			['non-Error rejection', 'private rejection details', new ClientSafeError(500, 'Internal server error').toJSON()],
		])('sends a safe result followed by updated for an %s', async (_name, error, expectedError) => {
			const method = jest.fn().mockRejectedValue(error);
			if (source === 'local') {
				server.methods({ failing: method });
			} else {
				remoteCall.mockRejectedValue(error);
			}

			await server.call(session, makePacket('failing'));

			expect(source === 'local' ? method : remoteCall).toHaveBeenCalledTimes(1);
			expect(sentPackets(session)).toEqual([
				{ msg: 'result', id: 'test-id', error: expectedError },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});
	});

	describe('with a call check', () => {
		const checkCall = jest.fn();

		beforeEach(() => {
			checkCall.mockReset();
			server = new Server(remoteCall, checkCall);
		});

		it.each(['local', 'remote'] as const)('checks a %s method call by its name before running it', async (source) => {
			const method = jest.fn();
			if (source === 'local') {
				server.methods({ save: method });
			}

			await server.call(session, makePacket('save'));

			expect(checkCall).toHaveBeenCalledWith(session, 'method', 'save');
			expect(checkCall.mock.invocationCallOrder[0]).toBeLessThan((source === 'local' ? method : remoteCall).mock.invocationCallOrder[0]);
		});

		it.each(['local', 'remote'] as const)('answers a rejected %s method call with the check error, without running it', async (source) => {
			const method = jest.fn();
			if (source === 'local') {
				server.methods({ save: method });
			}
			checkCall.mockImplementation(() => {
				throw new ClientSafeError('too-many-requests', 'Slow down', { timeToReset: 1000 });
			});

			await server.call(session, makePacket('save'));

			expect(method).not.toHaveBeenCalled();
			expect(remoteCall).not.toHaveBeenCalled();
			expect(sentPackets(session)).toEqual([
				{ msg: 'result', id: 'test-id', error: new ClientSafeError('too-many-requests', 'Slow down', { timeToReset: 1000 }).toJSON() },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});
	});

	it('does not execute a registered method or send messages to a disconnected session', async () => {
		const method = jest.fn();
		server.methods({ save: method });
		session.ws.readyState = WebSocket.CLOSED;

		await server.call(session, makePacket('save'));

		expect(method).not.toHaveBeenCalled();
		expect(remoteCall).not.toHaveBeenCalled();
		expect(session.send).not.toHaveBeenCalled();
	});
});

describe('Server subscriptions', () => {
	let server: Server;
	let session: ReturnType<typeof makeSession>;

	beforeEach(() => {
		server = new Server();
		session = makeSession();
	});

	it('registers a publication and forwards parameters with the publication as context', async () => {
		const handler = jest.fn(function (this: Publication) {
			this.added('messages', 'message1', { text: 'hello' });
			this.ready();
		});
		server.publish('messages', handler);

		await server.subscribe(session, makeSubscription());

		expect(handler).toHaveBeenCalledWith('room1', { useCollection: true });
		const publication = session.subscriptions.get('test-id');
		expect(publication).toBeInstanceOf(Publication);
		expect(handler.mock.contexts).toEqual([publication]);
		expect(publication?.client).toBe(session);
		expect(sentPackets(session)).toEqual([
			{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } },
			{ msg: 'ready', subs: ['test-id'] },
		]);
	});

	it('keeps the original publication when the same name is registered again', async () => {
		const original = jest.fn();
		const replacement = jest.fn();
		server.publish('messages', original);
		server.publish('messages', replacement);

		await server.subscribe(session, makeSubscription());

		expect(original).toHaveBeenCalledTimes(1);
		expect(replacement).not.toHaveBeenCalled();
	});

	it('ignores disconnected clients before executing or registering a publication', async () => {
		const handler = jest.fn();
		server.publish('messages', handler);
		session.ws.readyState = WebSocket.CLOSED;

		await server.subscribe(session, makeSubscription());

		expect(handler).not.toHaveBeenCalled();
		expect(session.subscriptions.size).toBe(0);
		expect(session.send).not.toHaveBeenCalled();
	});

	it('checks a subscription by its publication name before running it', async () => {
		const checkCall = jest.fn();
		server = new Server(undefined, checkCall);
		const handler = jest.fn();
		server.publish('messages', handler);

		await server.subscribe(session, makeSubscription());

		expect(checkCall).toHaveBeenCalledWith(session, 'subscription', 'messages');
		expect(checkCall.mock.invocationCallOrder[0]).toBeLessThan(handler.mock.invocationCallOrder[0]);
	});

	it('answers a rejected subscription with a nosub carrying the check error, without running it', async () => {
		server = new Server(undefined, () => {
			throw new ClientSafeError('too-many-requests', 'Slow down', { timeToReset: 1000 });
		});
		const handler = jest.fn();
		server.publish('messages', handler);

		await server.subscribe(session, makeSubscription());

		expect(handler).not.toHaveBeenCalled();
		expect(sentPackets(session)).toEqual([
			{ msg: 'nosub', id: 'test-id', error: new ClientSafeError('too-many-requests', 'Slow down', { timeToReset: 1000 }).toJSON() },
		]);
		expect(session.subscriptions.size).toBe(0);
	});

	it('does not check a subscription to a missing publication', async () => {
		const checkCall = jest.fn();
		server = new Server(undefined, checkCall);

		await server.subscribe(session, makeSubscription('missing'));

		expect(checkCall).not.toHaveBeenCalled();
	});

	it('sends a 404 nosub response for a missing publication', async () => {
		await server.subscribe(session, makeSubscription('missing'));

		expect(sentPackets(session)).toEqual([
			{ msg: 'nosub', id: 'test-id', error: new ClientSafeError(404, "Subscription 'missing' not found").toJSON() },
		]);
		expect(session.subscriptions.size).toBe(0);
	});

	it.each([
		[
			'expected',
			new ClientSafeError('not-authorized', 'Access denied', { room: 'room1' }),
			new ClientSafeError('not-authorized', 'Access denied', { room: 'room1' }).toJSON(),
		],
		['unexpected', new Error('private subscription details'), new ClientSafeError(500, 'Internal server error').toJSON()],
	])('sends a safe nosub response for an %s subscription failure', async (_name, error, expectedError) => {
		const handler = jest.fn().mockRejectedValue(error);
		server.publish('messages', handler);

		await server.subscribe(session, makeSubscription());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id', error: expectedError }]);
		expect(session.subscriptions.size).toBe(0);
		expect(session.listenerCount('close')).toBe(0);
	});

	it('handles a synchronous publication failure', async () => {
		const handler = jest.fn(() => {
			throw new ClientSafeError(403, 'Forbidden');
		});
		server.publish('messages', handler);

		await server.subscribe(session, makeSubscription());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id', error: new ClientSafeError(403, 'Forbidden').toJSON() }]);
		expect(session.subscriptions.size).toBe(0);
		expect(session.listenerCount('close')).toBe(0);
	});

	it('runs the stop callbacks a failed publication registered before failing', async () => {
		const onStop = jest.fn();
		server.publish('messages', function (this: Publication) {
			this.onStop(onStop);
			throw new ClientSafeError(403, 'Forbidden');
		});

		await server.subscribe(session, makeSubscription());

		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it('still answers a failed subscription when one of its stop callbacks throws', async () => {
		server.publish('messages', function (this: Publication) {
			this.onStop(() => {
				throw new Error('stop callback failure');
			});
			throw new ClientSafeError(403, 'Forbidden');
		});

		await expect(server.subscribe(session, makeSubscription())).rejects.toThrow('stop callback failure');

		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id', error: new ClientSafeError(403, 'Forbidden').toJSON() }]);
		expect(session.subscriptions.size).toBe(0);
		expect(session.listenerCount('close')).toBe(0);
	});

	it('starts metrics before execution and completes them after the async publication finishes', async () => {
		const end = jest.fn().mockReturnValue(0);
		const metrics: IServiceMetrics = {
			register: jest.fn(),
			hasMetric: jest.fn(),
			increment: jest.fn(),
			decrement: jest.fn(),
			set: jest.fn(),
			observe: jest.fn(),
			reset: jest.fn(),
			resetAll: jest.fn(),
			timer: jest.fn().mockReturnValue(end),
		};
		server.setMetrics(metrics);
		let finish!: () => void;
		const pending = new Promise<void>((resolve) => {
			finish = resolve;
		});
		const handler = jest.fn().mockReturnValue(pending);
		server.publish('messages', handler);

		const subscription = server.subscribe(session, makeSubscription());

		expect(metrics.timer).toHaveBeenCalledWith('rocketchat_subscription', { subscription: 'messages' });
		expect(handler).toHaveBeenCalledTimes(1);
		expect(jest.mocked(metrics.timer).mock.invocationCallOrder[0]).toBeLessThan(handler.mock.invocationCallOrder[0]);
		expect(end).not.toHaveBeenCalled();
		finish();
		await subscription;
		expect(end).toHaveBeenCalledTimes(1);
		expect(session.send).not.toHaveBeenCalled();
	});
});
