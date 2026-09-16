import type { IServiceMetrics } from '@rocket.chat/core-services';
import { MeteorError, MeteorService } from '@rocket.chat/core-services';
import ejson from 'ejson';
import WebSocket from 'ws';

import { Publication } from './Publication';
import { SERVER_ID, Server } from './Server';
import { makeClient, makePacket, makeSubscription, sentPackets } from './__tests__/helpers';

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

describe('Server.call', () => {
	let server: Server;

	beforeEach(() => {
		jest.clearAllMocks();
		mockCallMethodWithToken.mockReset();
		server = new Server();
	});

	describe('when the method is delegated to MeteorService', () => {
		it('returns the result value from MeteorService', async () => {
			mockCallMethodWithToken.mockResolvedValue({ result: 'some-value' });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('someMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), 'some-value');
		});

		it('does not return an error when the method returns void', async () => {
			mockCallMethodWithToken.mockResolvedValue({ result: undefined });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('setAvatarFromService'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), undefined);
		});

		it('calls result with an error when MeteorService throws', async () => {
			mockCallMethodWithToken.mockRejectedValue(new Error('boom'));
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('someMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), null, expect.any(Error));
		});
	});

	describe('when the method is registered locally', () => {
		it('returns the result value from the local method', async () => {
			server.methods({ localMethod: async () => 'local-result' });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('localMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), 'local-result');
		});

		it('does not return an error when the local method returns void', async () => {
			server.methods({ voidMethod: async () => undefined });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('voidMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), undefined);
		});
	});

	describe('when the client WebSocket is not open', () => {
		it('does nothing', async () => {
			const client = makeClient(WebSocket.CLOSED);
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('anyMethod'));

			expect(resultSpy).not.toHaveBeenCalled();
			expect(mockCallMethodWithToken).not.toHaveBeenCalled();
		});
	});
});

describe('Server packet codec', () => {
	const server = new Server();

	it('parses a standard EJSON packet including extended values', () => {
		expect(server.parse(Buffer.from('{"msg":"method","id":"m1","method":"save","params":[{"$date":0}]}'), false)).toEqual({
			msg: 'method',
			id: 'm1',
			method: 'save',
			params: [new Date(0)],
		});
	});

	it('selects and decodes only the first payload in an array-wrapped packet', () => {
		const data = JSON.stringify(['{"msg":"sub","id":"s1","name":"messages","params":[{"$date":0}]}', 'invalid ignored payload']);

		expect(server.parse(data, false)).toEqual({ msg: 'sub', id: 's1', name: 'messages', params: [new Date(0)] });
	});

	it('rejects binary messages with the expected Meteor error', () => {
		const parseBinary = () => server.parse(Buffer.from('{"msg":"ping"}'), true);

		expect(parseBinary).toThrow(MeteorError);
		expect(parseBinary).toThrow(expect.objectContaining({ error: 500, reason: 'Binary data not supported' }));
	});

	it.each(['not JSON', '[', '[]', '["not JSON"]'])('rejects invalid payload %s', (payload) => {
		expect(() => server.parse(payload, false)).toThrow();
	});

	it('serializes responses as EJSON with DDP field names', () => {
		expect(JSON.parse(server.serialize({ msg: 'result', id: 'm1', result: { createdAt: new Date(0) } }))).toEqual({
			msg: 'result',
			id: 'm1',
			result: { createdAt: { $date: 0 } },
		});
	});

	it('serializes the server identification packet', () => {
		expect(ejson.parse(SERVER_ID)).toEqual({ msg: 'server_id', server_id: '0' });
	});
});

describe('Server method contracts', () => {
	let server: Server;
	let client: ReturnType<typeof makeClient>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockCallMethodWithToken.mockReset();
		server = new Server();
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

	it('registers a stream under the stream-prefixed publication name', async () => {
		const handler = jest.fn();
		server.stream('room-messages', handler);

		await server.subscribe(client, makeSubscription('stream-room-messages'));

		expect(handler).toHaveBeenCalledWith('room1', { useCollection: true });
		expect(client.subscriptions.has('test-id')).toBe(true);
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
		// The publication created before the handler rejected must not outlive the failed subscription.
		expect(client.subscriptions.size).toBe(0);
		expect(client.listenerCount('close')).toBe(0);
	});

	it('handles a synchronous publication failure', async () => {
		const handler = jest.fn(() => {
			throw new MeteorError(403, 'Forbidden');
		});
		server.publish('messages', handler);

		await server.subscribe(client, makeSubscription());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(sentPackets(client)).toEqual([{ msg: 'nosub', id: 'test-id', error: new MeteorError(403, 'Forbidden').toJSON() }]);
		expect(client.subscriptions.size).toBe(0);
		expect(client.listenerCount('close')).toBe(0);
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

describe('Server protocol responses', () => {
	let server: Server;
	let client: ReturnType<typeof makeClient>;

	beforeEach(() => {
		server = new Server();
		client = makeClient();
	});

	it('sends result before updated using the request ID and EJSON values', () => {
		server.result(client, makePacket('save', 'm1'), { date: new Date(0) });

		expect(sentPackets(client)).toEqual([
			{ msg: 'result', id: 'm1', result: { date: new Date(0) } },
			{ msg: 'updated', methods: ['m1'] },
		]);
	});

	it('sends nosub without an error for a normal unsubscribe', () => {
		server.nosub(client, makeSubscription());

		expect(sentPackets(client)).toEqual([{ msg: 'nosub', id: 'test-id' }]);
	});

	it.each(['result', 'nosub'] as const)('serializes Meteor errors in %s messages', (response) => {
		const error = new MeteorError(403, 'Forbidden', { permission: 'view-room' });
		if (response === 'result') {
			server.result(client, makePacket('save'), undefined, error);
		} else {
			server.nosub(client, makeSubscription(), error);
		}

		expect(sentPackets(client)[0]).toEqual({
			msg: response,
			id: 'test-id',
			error: {
				isClientSafe: true,
				errorType: 'Meteor.Error',
				error: 403,
				reason: 'Forbidden',
				message: 'Forbidden [403]',
				details: { permission: 'view-room' },
			},
		});
	});

	it.each(['result', 'nosub'] as const)('serializes enumerable properties of non-DDP errors in %s messages', (response) => {
		const error = Object.assign(new Error('non-enumerable message'), { code: 'transport-error' });
		if (response === 'result') {
			server.result(client, makePacket('save'), undefined, error);
		} else {
			server.nosub(client, makeSubscription(), error);
		}

		expect(sentPackets(client)[0]).toEqual({ msg: response, id: 'test-id', error: { code: 'transport-error' } });
	});
});
