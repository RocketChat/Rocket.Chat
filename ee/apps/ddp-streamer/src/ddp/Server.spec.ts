import type { IServiceMetrics } from '@rocket.chat/core-services';
import { MeteorError, MeteorService } from '@rocket.chat/core-services';
import WebSocket from 'ws';

import { Publication } from './Publication';
import { Server } from './Server';
import { makeClient, makePacket, makeSubscription, sentPackets } from '../__tests__/helpers';
import { callMeteorMethod } from '../methods/meteorFallback';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	MeteorService: {
		callMethodWithToken: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const mockCallMethodWithToken = jest.mocked(MeteorService.callMethodWithToken);

describe('Server method contracts', () => {
	let server: Server;
	let client: ReturnType<typeof makeClient>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockCallMethodWithToken.mockReset();
		server = new Server(callMeteorMethod);
		client = makeClient();
	});

	it('registers multiple methods and retains the original when a name is duplicated', async () => {
		const first = jest.fn().mockReturnValue('first result');
		const second = jest.fn().mockResolvedValue('second result');
		const replacement = jest.fn();
		server.methods({ first, second });
		server.methods({ first: replacement });

		await server.call(client, makePacket('first', 'm1'));
		await server.call(client, makePacket('second', 'm2'));

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(replacement).not.toHaveBeenCalled();
		expect(mockCallMethodWithToken).not.toHaveBeenCalled();
		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'm1', result: 'first result' },
			{ msg: 'updated', methods: ['m1'] },
			{ msg: 'result', id: 'm2', result: 'second result' },
			{ msg: 'updated', methods: ['m2'] },
		]);
	});

	it('forwards parameters and binds the local method to the client', async () => {
		const method = jest.fn().mockResolvedValue({ saved: true });
		server.methods({ save: method });
		const packet = { ...makePacket('save'), params: ['room1', { text: 'hello' }] };

		await server.call(client, packet);

		expect(method).toHaveBeenCalledWith('room1', { text: 'hello' });
		expect(method.mock.contexts).toEqual([client]);
		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'test-id', result: { saved: true } },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('forwards credentials and parameters to Meteor and sends its result', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: 'remote result' });
		const packet = { ...makePacket('remote'), params: ['room1', 42] };

		await server.call(client, packet);

		expect(mockCallMethodWithToken).toHaveBeenCalledWith('user1', 'token1', 'remote', ['room1', 42]);
		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'test-id', result: 'remote result' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('sends result and updated when a local method returns void', async () => {
		const method = jest.fn();
		server.methods({ save: method });

		await server.call(client, makePacket('save'));

		expect(method).toHaveBeenCalledTimes(1);
		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'test-id' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	it('sends result and updated when a Meteor method returns void', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: undefined });

		await server.call(client, makePacket('setAvatarFromService'));

		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'test-id' },
			{ msg: 'updated', methods: ['test-id'] },
		]);
	});

	describe.each(['local', 'Meteor'] as const)('%s failures', (source) => {
		it.each([
			[
				'expected error',
				new MeteorError(403, 'Forbidden', { permission: 'view-room' }),
				new MeteorError(403, 'Forbidden', { permission: 'view-room' }).toJSON(),
			],
			['unexpected error', new Error('private database details'), new MeteorError(500, 'Internal server error').toJSON()],
			['non-Error rejection', 'private rejection details', new MeteorError(500, 'Internal server error').toJSON()],
		])('sends a safe result followed by updated for an %s', async (_name, error, expectedError) => {
			const method = jest.fn().mockRejectedValue(error);
			if (source === 'local') {
				server.methods({ failing: method });
			} else {
				mockCallMethodWithToken.mockRejectedValue(error);
			}

			await server.call(client, makePacket('failing'));

			expect(source === 'local' ? method : mockCallMethodWithToken).toHaveBeenCalledTimes(1);
			expect(sentPackets(client)).toEqual([
				{ msg: 'result', id: 'test-id', error: expectedError },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});
	});

	it('does not execute a registered method or send messages to a disconnected client', async () => {
		const method = jest.fn();
		server.methods({ save: method });
		client.ws.readyState = WebSocket.CLOSED;

		await server.call(client, makePacket('save'));

		expect(method).not.toHaveBeenCalled();
		expect(mockCallMethodWithToken).not.toHaveBeenCalled();
		expect(client.send).not.toHaveBeenCalled();
	});
});

describe('Server subscriptions', () => {
	let server: Server;
	let client: ReturnType<typeof makeClient>;

	beforeEach(() => {
		server = new Server();
		client = makeClient();
	});

	it('registers a publication and forwards parameters with the publication as context', async () => {
		const handler = jest.fn(function (this: Publication) {
			this.added('messages', 'message1', { text: 'hello' });
			this.ready();
		});
		server.publish('messages', handler);

		await server.subscribe(client, makeSubscription());

		expect(handler).toHaveBeenCalledWith('room1', { useCollection: true });
		const publication = client.subscriptions.get('test-id');
		expect(publication).toBeInstanceOf(Publication);
		expect(handler.mock.contexts).toEqual([publication]);
		expect(publication?.client).toBe(client);
		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } },
			{ msg: 'ready', subs: ['test-id'] },
		]);
	});

	it('keeps the original publication when the same name is registered again', async () => {
		const original = jest.fn();
		const replacement = jest.fn();
		server.publish('messages', original);
		server.publish('messages', replacement);

		await server.subscribe(client, makeSubscription());

		expect(original).toHaveBeenCalledTimes(1);
		expect(replacement).not.toHaveBeenCalled();
	});

	it('ignores disconnected clients before executing or registering a publication', async () => {
		const handler = jest.fn();
		server.publish('messages', handler);
		client.ws.readyState = WebSocket.CLOSED;

		await server.subscribe(client, makeSubscription());

		expect(handler).not.toHaveBeenCalled();
		expect(client.subscriptions.size).toBe(0);
		expect(client.send).not.toHaveBeenCalled();
	});

	it('sends a 404 nosub response for a missing publication', async () => {
		await server.subscribe(client, makeSubscription('missing'));

		expect(sentPackets(client)).toEqual([
			{ msg: 'nosub', id: 'test-id', error: new MeteorError(404, "Subscription 'missing' not found").toJSON() },
		]);
		expect(client.subscriptions.size).toBe(0);
	});

	it.each([
		[
			'expected',
			new MeteorError('not-authorized', 'Access denied', { room: 'room1' }),
			new MeteorError('not-authorized', 'Access denied', { room: 'room1' }).toJSON(),
		],
		['unexpected', new Error('private subscription details'), new MeteorError(500, 'Internal server error').toJSON()],
	])('sends a safe nosub response for an %s subscription failure', async (_name, error, expectedError) => {
		const handler = jest.fn().mockRejectedValue(error);
		server.publish('messages', handler);

		await server.subscribe(client, makeSubscription());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(sentPackets(client)).toEqual([{ msg: 'nosub', id: 'test-id', error: expectedError }]);
	});

	it('handles a synchronous publication failure', async () => {
		const handler = jest.fn(() => {
			throw new MeteorError(403, 'Forbidden');
		});
		server.publish('messages', handler);

		await server.subscribe(client, makeSubscription());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(sentPackets(client)).toEqual([{ msg: 'nosub', id: 'test-id', error: new MeteorError(403, 'Forbidden').toJSON() }]);
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

		const subscription = server.subscribe(client, makeSubscription());

		expect(metrics.timer).toHaveBeenCalledWith('rocketchat_subscription', { subscription: 'messages' });
		expect(handler).toHaveBeenCalledTimes(1);
		expect(jest.mocked(metrics.timer).mock.invocationCallOrder[0]).toBeLessThan(handler.mock.invocationCallOrder[0]);
		expect(end).not.toHaveBeenCalled();
		finish();
		await subscription;
		expect(end).toHaveBeenCalledTimes(1);
		expect(client.send).not.toHaveBeenCalled();
	});
});
