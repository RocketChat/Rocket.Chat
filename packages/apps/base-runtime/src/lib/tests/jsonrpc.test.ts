import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import * as jsonrpc from '../jsonrpc';

/**
 * The optional slots (`params`, `meta`, `error.data`) must stay ABSENT rather
 * than present-and-undefined. The msgpack codec distinguishes the two, so every
 * assertion below uses `in` instead of comparing to `undefined`.
 */
describe('jsonrpc', () => {
	const meta = { traceId: 'trace-1' };

	describe('request', () => {
		it('should keep the meta it receives', () => {
			const message = jsonrpc.request(1, 'test', ['param'], meta);

			assert.deepStrictEqual(message.meta, meta);
			assert.deepStrictEqual(message.params, ['param']);
		});

		it('should leave meta absent when it is not supplied', () => {
			const message = jsonrpc.request(1, 'test', ['param']);

			assert.strictEqual('meta' in message, false);
		});

		it('should leave params absent when only meta is supplied', () => {
			const message = jsonrpc.request(1, 'test', undefined, meta);

			assert.strictEqual('params' in message, false);
			assert.deepStrictEqual(message.meta, meta);
		});
	});

	describe('notification', () => {
		it('should keep the meta it receives', () => {
			const message = jsonrpc.notification('test', ['param'], meta);

			assert.deepStrictEqual(message.meta, meta);
			assert.deepStrictEqual(message.params, ['param']);
		});

		it('should leave meta absent when it is not supplied', () => {
			const message = jsonrpc.notification('test', ['param']);

			assert.strictEqual('meta' in message, false);
		});

		it('should leave params absent when only meta is supplied', () => {
			const message = jsonrpc.notification('test', undefined, meta);

			assert.strictEqual('params' in message, false);
			assert.deepStrictEqual(message.meta, meta);
		});
	});

	describe('success', () => {
		it('should keep the meta it receives', () => {
			const message = jsonrpc.success(1, { value: 'result' }, meta);

			assert.deepStrictEqual(message.meta, meta);
			assert.deepStrictEqual(message.result, { value: 'result' });
		});

		it('should leave meta absent when it is not supplied', () => {
			const message = jsonrpc.success(1, null);

			assert.strictEqual('meta' in message, false);
			assert.strictEqual(message.result, null);
		});
	});

	describe('error', () => {
		it('should keep the meta it receives', () => {
			const message = jsonrpc.error(1, jsonrpc.JsonRpcError.internalError('cause'), meta);

			assert.deepStrictEqual(message.meta, meta);
			assert.strictEqual(message.error.code, -32603);
			assert.strictEqual(message.error.data, 'cause');
		});

		it('should leave meta absent when it is not supplied', () => {
			const message = jsonrpc.error(1, jsonrpc.JsonRpcError.internalError());

			assert.strictEqual('meta' in message, false);
			assert.strictEqual('data' in message.error, false);
		});
	});
});
