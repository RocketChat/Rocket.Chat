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

	describe('guards', () => {
		const guards = {
			request: jsonrpc.isRequestObject,
			notification: jsonrpc.isNotificationObject,
			success: jsonrpc.isSuccessObject,
			error: jsonrpc.isErrorObject,
		};

		/** No guard but the named one may accept the message; `none` means every guard rejects it. */
		const assertCategorizesAs = (kind: keyof typeof guards | 'none', message: unknown) => {
			for (const [name, guard] of Object.entries(guards)) {
				assert.strictEqual(guard(message), name === kind, `${name} guard on ${JSON.stringify(message)}`);
			}
		};

		it('should accept each shape the factories build', () => {
			assertCategorizesAs('request', jsonrpc.request('id-1', 'app:getStatus'));
			assertCategorizesAs('notification', jsonrpc.notification('ready', []));
			assertCategorizesAs('success', jsonrpc.success('id-1', { value: null }));
			assertCategorizesAs('error', jsonrpc.error('id-1', jsonrpc.JsonRpcError.internalError()));
		});

		it('should accept the id types JSON-RPC 2.0 allows', () => {
			assertCategorizesAs('request', jsonrpc.request(1, 'app:getStatus'));
			assertCategorizesAs('request', jsonrpc.request(null, 'app:getStatus'));
			// `parseMessage` and the invalid-request path both answer with a null id.
			assertCategorizesAs('error', jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(null)));
		});

		it('should reject a response that carries both result and error', () => {
			// The host tests for a success first, so an ambiguous map used to resolve the
			// pending request as successful and drop the error alongside it.
			assertCategorizesAs('none', {
				jsonrpc: '2.0',
				id: 'id-1',
				result: { value: null },
				error: { message: 'boom', code: jsonrpc.SERVER_ERROR },
			});
		});

		it('should reject a response with no id', () => {
			assertCategorizesAs('none', { jsonrpc: '2.0', result: { value: null } });
			assertCategorizesAs('none', { jsonrpc: '2.0', error: { message: 'boom', code: jsonrpc.SERVER_ERROR } });
		});

		it('should reject a request whose id is neither a string, a number, nor null', () => {
			for (const id of [{}, [], true, Symbol('id')]) {
				assertCategorizesAs('none', { jsonrpc: '2.0', id, method: 'app:getStatus' });
			}
		});

		it('should reject an id that is a number but not finite', () => {
			// These pass `typeof value === 'number'`, so the loop above cannot cover them.
			// msgpack carries them; JSON cannot, and `JSON.stringify({ id: NaN })` yields
			// `{"id":null}` — an id that changes meaning at a JSON boundary cannot route.
			for (const id of [NaN, Infinity, -Infinity]) {
				assertCategorizesAs('none', { jsonrpc: '2.0', id, method: 'app:getStatus' });
				assertCategorizesAs('none', { jsonrpc: '2.0', id, result: { value: null } });
				assertCategorizesAs('none', { jsonrpc: '2.0', id, error: { message: 'boom', code: jsonrpc.SERVER_ERROR } });
			}
		});

		it('should reject a foreign object and a wrong version', () => {
			assertCategorizesAs('none', { id: 'id-1', method: 'app:getStatus' });
			assertCategorizesAs('none', { jsonrpc: '1.0', id: 'id-1', method: 'app:getStatus' });
			assertCategorizesAs('none', null);
			assertCategorizesAs('none', 'a string');
		});

		it('should reject an error payload that is not a SerializedJsonRpcError', () => {
			assertCategorizesAs('none', { jsonrpc: '2.0', id: 'id-1', error: 'boom' });
			assertCategorizesAs('none', { jsonrpc: '2.0', id: 'id-1', error: { message: 'boom' } });
			assertCategorizesAs('none', { jsonrpc: '2.0', id: 'id-1', error: { code: jsonrpc.SERVER_ERROR } });
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
