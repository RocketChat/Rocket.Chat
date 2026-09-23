import * as assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { describe, it } from 'node:test';

import { z } from 'zod';

import { error, JsonRpcError, request as requestMessage, success } from '../../../protocol/src/framing/jsonrpc';
import type { Transport } from '../../../protocol/src/rpc/client';
import { createClient } from '../../../protocol/src/rpc/client';
import { notification, request, type } from '../../../protocol/src/rpc/contract';
import { ProcedureError } from '../../../protocol/src/rpc/errors';
import { implement } from '../../../protocol/src/rpc/server';

const contract = {
	room: {
		getById: request({
			input: z.strictObject({ roomId: z.string() }),
			output: type<{ id: string }>(),
			errors: { ROOM_NOT_FOUND: type<{ roomId: string }>() },
		}),
		list: request({ input: z.strictObject({}), output: type<string[]>() }),
	},
	runtime: {
		log: notification({ input: z.strictObject({ entries: z.array(z.string()) }) }),
	},
};

type Sent = { method: string; params: object };

const recordingTransport = (respond: (message: Sent) => Promise<{ result: unknown }>) => {
	const requests: Sent[] = [];
	const notifications: Sent[] = [];

	const transport: Transport = {
		request: (message) => {
			requests.push(message);

			return respond(message);
		},
		notify: (message) => {
			notifications.push(message);
		},
	};

	return { transport, requests, notifications };
};

describe('createClient', () => {
	it('sends the path as the method and the params as one object', async () => {
		const { transport, requests } = recordingTransport(async () => success('k1', { id: 'r1' }));

		assert.deepStrictEqual(await createClient<typeof contract>(transport).request('room.getById', { roomId: 'r1' }), { id: 'r1' });
		assert.deepStrictEqual(requests, [{ method: 'room.getById', params: { roomId: 'r1' } }]);
	});

	it('sends {} for params that are left out', async () => {
		const { transport, requests } = recordingTransport(async () => success('k1', []));

		await createClient<typeof contract>(transport).request('room.list');

		assert.deepStrictEqual(requests, [{ method: 'room.list', params: {} }]);
	});

	it('sends a notification without a response', () => {
		const { transport, notifications } = recordingTransport(() => assert.fail('a notification is not a request'));

		createClient<typeof contract>(transport).notify('runtime.log', { entries: ['a'] });

		assert.deepStrictEqual(notifications, [{ method: 'runtime.log', params: { entries: ['a'] } }]);
	});

	it('rebuilds a -32001 response as the declared error', async () => {
		const { transport } = recordingTransport(async () => {
			throw error('k1', new JsonRpcError('failed', -32001, { name: 'ROOM_NOT_FOUND', data: { roomId: 'r1' } }));
		});

		await assert.rejects(createClient<typeof contract>(transport).request('room.getById', { roomId: 'r1' }), (thrown) => {
			assert.ok(thrown instanceof ProcedureError);
			assert.strictEqual(thrown.path, 'room.getById');
			assert.strictEqual(thrown.name, 'ROOM_NOT_FOUND');
			assert.deepStrictEqual(thrown.data, { roomId: 'r1' });

			return true;
		});
	});

	it('rebuilds any other error response as an Error with its message', async () => {
		const { transport } = recordingTransport(async () => {
			throw error('k1', new JsonRpcError('the bridge threw', -32000));
		});

		await assert.rejects(createClient<typeof contract>(transport).request('room.list'), (thrown) => {
			assert.ok(thrown instanceof Error && !(thrown instanceof ProcedureError));
			assert.strictEqual(thrown.message, 'the bridge threw');

			return true;
		});
	});

	it('passes an Error rejection through', async () => {
		const rejection = new Error('channel closed');
		const { transport } = recordingTransport(() => Promise.reject(rejection));

		await assert.rejects(createClient<typeof contract>(transport).request('room.list'), (thrown) => thrown === rejection);
	});

	it('wraps any other rejection as the cause of an Error', async () => {
		const { transport } = recordingTransport(() => Promise.reject('timeout'));

		await assert.rejects(createClient<typeof contract>(transport).request('room.list'), (thrown) => {
			assert.ok(thrown instanceof Error);
			assert.strictEqual(thrown.cause, 'timeout');

			return true;
		});
	});

	it('round-trips a declared error through dispatch', async () => {
		const implementation = implement(contract, {
			room: {
				getById: ({ input, errors }) => {
					throw errors.ROOM_NOT_FOUND({ roomId: input.roomId });
				},
				list: () => [],
			},
			runtime: { log: () => undefined },
		});

		const transport: Transport = {
			request: async ({ method, params }) => {
				const response = await implementation.dispatch(requestMessage('k1', method, params), {});

				if (response && 'error' in response) {
					throw structuredClone(response);
				}

				return structuredClone(response as { result: unknown });
			},
			notify: () => undefined,
		};

		await assert.rejects(createClient<typeof contract>(transport).request('room.getById', { roomId: 'r1' }), (thrown) => {
			assert.ok(thrown instanceof ProcedureError);
			assert.deepStrictEqual(thrown.data, { roomId: 'r1' });

			return true;
		});
	});

	it('does not load Zod', () => {
		const clientModule = path.resolve(__dirname, '../../../protocol/src/rpc/client.ts');
		const script = `require(${JSON.stringify(clientModule)}); process.stdout.write(String(Object.keys(require.cache).some((file) => /[\\\\/]zod[\\\\/]/.test(file))));`;

		const output = execFileSync(process.execPath, ['--require', 'ts-node/register/transpile-only', '-e', script], { encoding: 'utf8' });

		assert.strictEqual(output, 'false');
	});
});
