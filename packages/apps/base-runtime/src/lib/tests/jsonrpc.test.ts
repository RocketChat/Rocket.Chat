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

	describe('JsonRpcError', () => {
		it('should not accept a successful result that happens to look like an error payload', () => {
			// The runtime's main loop picks a success response over an error response with
			// this exact test, and an app controls the shape of its own return value. An
			// API endpoint that answers `{ status, message, code }` must stay a success.
			const apiResponse = { status: 200, message: 'created', code: 0 };

			assert.strictEqual(apiResponse instanceof jsonrpc.JsonRpcError, false);
		});

		it('should accept a payload it built itself', () => {
			assert.ok(jsonrpc.JsonRpcError.invalidParams(null) instanceof jsonrpc.JsonRpcError);
			assert.ok(new jsonrpc.JsonRpcError('boom', jsonrpc.SERVER_ERROR) instanceof jsonrpc.JsonRpcError);
		});

		it('should expose message and code as own enumerable properties, so msgpack keeps them', () => {
			// This is why the class does not extend `Error`: an `Error`'s `message` is
			// non-enumerable, and msgpack would drop it at the process boundary.
			const payload = new jsonrpc.JsonRpcError('boom', jsonrpc.SERVER_ERROR);

			assert.deepStrictEqual(Object.keys(payload), ['message', 'code']);
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
