import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { z } from 'zod';

import { notification as notificationMessage, request as requestMessage } from '../../../protocol/src/framing/jsonrpc';
import { notification, request, type } from '../../../protocol/src/rpc/contract';
import { ProcedureError } from '../../../protocol/src/rpc/errors';
import type { Handlers, Middleware } from '../../../protocol/src/rpc/server';
import { InputError, UnknownProcedureError, implement, use } from '../../../protocol/src/rpc/server';

type Ctx = { appId: string; calls: string[] };

const contract = {
	room: {
		getById: request({
			input: z.strictObject({ roomId: z.string() }),
			output: type<{ id: string; appId: string } | undefined>(),
			errors: { ROOM_NOT_FOUND: type<{ roomId: string }>() },
		}),
		archive: request({ input: z.strictObject({ roomId: z.string() }), output: type<void>() }),
		fail: request({ input: z.strictObject({}), output: type<void>() }),
	},
	runtime: {
		log: notification({ input: z.strictObject({ entries: z.array(z.string()) }) }),
	},
};

const record =
	(name: string): Middleware<Ctx> =>
	({ ctx, next }) => {
		ctx.calls.push(name);

		return next();
	};

const roomHandlers: Handlers<(typeof contract)['room'], Ctx> = {
	getById: ({ ctx, input, errors }) => {
		ctx.calls.push('handler');

		if (input.roomId === 'missing') {
			throw errors.ROOM_NOT_FOUND({ roomId: input.roomId });
		}

		return { id: input.roomId, appId: ctx.appId };
	},
	archive: use(record('procedure'), ({ ctx }) => {
		ctx.calls.push('handler');
	}),
	fail: () => {
		throw new Error('the bridge threw');
	},
};

const runtimeHandlers: Handlers<(typeof contract)['runtime'], Ctx> = {
	log: ({ ctx, input }) => {
		ctx.calls.push(...input.entries);
	},
};

const implementation = implement(
	contract,
	{ room: use(record('domain'), roomHandlers), runtime: runtimeHandlers },
	{ use: [record('implement')] },
);

const newContext = (): Ctx => ({ appId: 'app1', calls: [] });

describe('implement', () => {
	it('throws on a procedure without a handler', () => {
		assert.throws(() => implement(contract, { room: roomHandlers } as never), /No handler for runtime\.log/);
	});

	it('throws on a contract key that contains a dot', () => {
		const dotted = { 'room.v2': { archive: contract.room.archive } };

		assert.throws(() => implement(dotted, { 'room.v2': { archive: () => undefined } }), TypeError);
	});
});

describe('call', () => {
	it('passes the context and the parsed input to the handler', async () => {
		assert.deepStrictEqual(await implementation.call('room.getById', { roomId: 'r1' }, newContext()), { id: 'r1', appId: 'app1' });
	});

	it('throws UnknownProcedureError on a path the contract does not declare', async () => {
		await assert.rejects(implementation.call('room.delete', {}, newContext()), UnknownProcedureError);
	});

	it('throws InputError on a params object that fails the schema', async () => {
		await assert.rejects(implementation.call('room.getById', { roomId: 42 }, newContext()), InputError);
	});

	it('throws InputError on a key that the input does not declare', async () => {
		await assert.rejects(implementation.call('room.getById', { roomId: 'r1', appId: 'other' }, newContext()), InputError);
	});

	it('throws the declared error that the handler builds', async () => {
		await assert.rejects(implementation.call('room.getById', { roomId: 'missing' }, newContext()), (error) => {
			assert.ok(error instanceof ProcedureError);
			assert.strictEqual(error.path, 'room.getById');
			assert.strictEqual(error.name, 'ROOM_NOT_FOUND');
			assert.deepStrictEqual(error.data, { roomId: 'missing' });

			return true;
		});
	});

	it('does not run the middleware when the input fails the schema', async () => {
		const ctx = newContext();

		await assert.rejects(implementation.call('room.archive', {}, ctx));

		assert.deepStrictEqual(ctx.calls, []);
	});
});

describe('middleware', () => {
	it('runs the implement level, the domain level, the procedure level, then the handler', async () => {
		const ctx = newContext();

		await implementation.call('room.archive', { roomId: 'r1' }, ctx);

		assert.deepStrictEqual(ctx.calls, ['implement', 'domain', 'procedure', 'handler']);
	});

	it('skips the handler when it returns without a call to next', async () => {
		const skip: Middleware<Ctx> = () => 'skipped';
		const skipping = implement(contract, { room: { ...roomHandlers, getById: use(skip, roomHandlers.getById) }, runtime: runtimeHandlers });
		const ctx = newContext();

		assert.strictEqual(await skipping.call('room.getById', { roomId: 'r1' }, ctx), 'skipped');
		assert.deepStrictEqual(ctx.calls, []);
	});

	it('gets the path, the procedure and the parsed input', async () => {
		let seen: unknown;
		const spy: Middleware<Ctx> = ({ path, procedure, input, next }) => {
			seen = { path, procedure, input };

			return next();
		};

		await implement(contract, { room: roomHandlers, runtime: runtimeHandlers }, { use: [spy] }).call(
			'room.getById',
			{ roomId: 'r1' },
			newContext(),
		);

		assert.deepStrictEqual(seen, { path: 'room.getById', procedure: contract.room.getById, input: { roomId: 'r1' } });
	});
});

describe('dispatch', () => {
	const dispatchRequest = (method: string, params: object) => implementation.dispatch(requestMessage('k1', method, params), newContext());

	it('answers a request with the handler value', async () => {
		assert.deepStrictEqual(await dispatchRequest('room.getById', { roomId: 'r1' }), {
			jsonrpc: '2.0',
			id: 'k1',
			result: { id: 'r1', appId: 'app1' },
		});
	});

	it('answers null for a handler that returns nothing', async () => {
		assert.deepStrictEqual(await dispatchRequest('room.archive', { roomId: 'r1' }), { jsonrpc: '2.0', id: 'k1', result: null });
	});

	it('answers -32601 with the path for an unknown path', async () => {
		const response = await dispatchRequest('bridges:getRoomBridge:doGetById', ['r1']);

		assert.strictEqual(response?.error?.code, -32601);
		assert.strictEqual(response?.error?.data, 'bridges:getRoomBridge:doGetById');
	});

	it('answers -32600 for a request to a notification procedure', async () => {
		const response = await dispatchRequest('runtime.log', { entries: [] });

		assert.strictEqual(response?.error?.code, -32600);
	});

	it('answers -32602 with the issues for an invalid input', async () => {
		const response = await dispatchRequest('room.getById', { roomId: 42 });

		assert.strictEqual(response?.error?.code, -32602);
		assert.deepStrictEqual(
			(response?.error?.data as { path: unknown[] }[]).map((issue) => issue.path),
			[['roomId']],
		);
	});

	it('answers -32001 with the name and the data for a declared error', async () => {
		const response = await dispatchRequest('room.getById', { roomId: 'missing' });

		assert.strictEqual(response?.error?.code, -32001);
		assert.deepStrictEqual(response?.error?.data, { name: 'ROOM_NOT_FOUND', data: { roomId: 'missing' } });
	});

	it('answers -32000 with the message for an error that the handler throws', async () => {
		const response = await dispatchRequest('room.fail', {});

		assert.strictEqual(response?.error?.code, -32000);
		assert.strictEqual(response?.error?.message, 'the bridge threw');
		assert.strictEqual('data' in (response?.error ?? {}), false);
	});

	it('keeps the code of an error that carries -32070', async () => {
		const failing = implement(contract, {
			room: {
				...roomHandlers,
				fail: () => {
					throw Object.assign(new Error('not allowed'), { code: -32070, data: { name: 'UserNotAllowedException' } });
				},
			},
			runtime: runtimeHandlers,
		});

		const response = await failing.dispatch(requestMessage('k1', 'room.fail', {}), newContext());

		assert.deepStrictEqual({ ...response?.error }, { message: 'not allowed', code: -32070, data: { name: 'UserNotAllowedException' } });
	});

	it('runs a notification and answers nothing', async () => {
		const ctx = newContext();

		assert.strictEqual(await implementation.dispatch(notificationMessage('runtime.log', { entries: ['a', 'b'] }), ctx), undefined);
		assert.deepStrictEqual(ctx.calls, ['implement', 'a', 'b']);
	});

	it('rejects a notification that fails', async () => {
		await assert.rejects(implementation.dispatch(notificationMessage('runtime.log', { entries: 'a' }), newContext()), InputError);
	});

	it('rejects a notification to a request procedure', async () => {
		await assert.rejects(
			implementation.dispatch(notificationMessage('room.archive', { roomId: 'r1' }), newContext()),
			/Wrong message kind/,
		);
	});
});
