import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { kSecureFields } from '../../../../src/lib/SecureFields';
import {
	error,
	isErrorObject,
	isNotificationObject,
	isRequestObject,
	isSuccessObject,
	JsonRpcError,
	notification,
	request,
	success,
	type JsonRpc,
} from '../../../../src/lib/jsonrpc';
import { newDecoder, newEncoder } from '../../../../src/server/runtime/base/codec';

/**
 * The envelope goes on the wire as a plain msgpack map of its own properties, and
 * the receiver categorizes it with the type guards. These tests pin that contract
 * down: every kind survives the round-trip, only its own guard accepts it, the
 * optional slots stay absent, and `meta` crosses - which the codec extension this
 * replaced used to drop.
 */
describe('codec', () => {
	const roundTrip = (message: unknown): unknown => newDecoder().decode(newEncoder().encode(message));

	const guards = {
		request: isRequestObject,
		notification: isNotificationObject,
		success: isSuccessObject,
		error: isErrorObject,
	};

	/** Only the message's own guard may accept it. */
	const assertCategorizesAs = (kind: keyof typeof guards, message: unknown) => {
		for (const [name, guard] of Object.entries(guards)) {
			assert.strictEqual(guard(message), name === kind, `${name} guard on a ${kind}`);
		}
	};

	const cases: [keyof typeof guards, JsonRpc][] = [
		['request', request('id-1', 'bridges:getUserBridge:doGetById', ['user-1', 'APP_ID'])],
		['notification', notification('ready', [])],
		['success', success('id-1', { value: { _id: 'message-1' } })],
		['error', error('id-1', JsonRpcError.internalError({ cause: 'boom' }))],
	];

	for (const [kind, message] of cases) {
		it(`should round-trip a ${kind}`, () => {
			const received = roundTrip(message);

			// `{ ...message.error }` flattens the `JsonRpcError` instance the error case
			// carries: what arrives is a plain map, and `deepStrictEqual` compares
			// prototypes. The next test pins that asymmetry on its own.
			assert.deepStrictEqual(received, message.error ? { ...message, error: { ...message.error } } : message);
			assertCategorizesAs(kind, received);
		});
	}

	it('should hand back an error payload as a plain map, not a JsonRpcError', () => {
		const received = roundTrip(error('id-1', JsonRpcError.internalError({ cause: 'boom' })));

		assert.ok(isErrorObject(received));
		// THE RULE, as a test: `instanceof` holds for a payload this process built, and
		// never for one that came off the wire. Read a received payload by its fields.
		assert.strictEqual(received.error instanceof JsonRpcError, false);
		assert.strictEqual(received.error.message, 'Internal error');
		assert.strictEqual(received.error.code, -32603);
		assert.deepStrictEqual(received.error.data, { cause: 'boom' });
	});

	it('should carry the meta of every kind across the wire', () => {
		const meta = { traceId: 'trace-1' };

		for (const [, message] of cases) {
			const received = roundTrip({ ...message, meta }) as JsonRpc;

			assert.deepStrictEqual(received.meta, meta);
		}
	});

	it('should keep the absent optional slots absent', () => {
		const received = roundTrip(error('id-1', JsonRpcError.parseError())) as { error: object };

		assert.strictEqual('meta' in received, false);
		assert.strictEqual('data' in received.error, false);
	});

	it('should keep a notification free of an id', () => {
		const received = roundTrip(notification('log', [{ severity: 'info' }]));

		assert.strictEqual('id' in (received as object), false);
		assertCategorizesAs('notification', received);
	});

	it('should hand back a Buffer nested in the params', () => {
		const buffer = Buffer.from('file contents');

		const received = roundTrip(request('id-1', 'app:executePreFileUpload', [{ buffer }])) as {
			params: [{ buffer: Buffer }];
		};

		assert.ok(Buffer.isBuffer(received.params[0].buffer));
		assert.strictEqual(received.params[0].buffer.toString(), 'file contents');
	});

	it('should hand a nested object with secure fields to its own extension', () => {
		const room = {
			id: 'room-1',
			[kSecureFields]: [{ permission: 'abac.read', name: 'abacAttributes', value: [] }],
		};

		const received = roundTrip(request('id-1', 'app:construct', [{ room }])) as {
			params: [{ room: unknown }];
		};

		// The secure fields extension claims the object on encode, and its decode side
		// yields `undefined` here on purpose: only the subprocess resolves secure fields
		// (see `base-runtime/src/lib/codec.ts`), and it never sends them back.
		assert.strictEqual(received.params[0].room, undefined);
	});
});
