/**
 * The two pipelines under test.
 *
 * Each contender covers the whole path a message takes across the process
 * boundary, split into the three steps the runtime actually performs:
 *
 *   build   - turn a call site's arguments into a message object
 *   encode  - msgpack the message onto the pipe (`ProcessMessenger.send`)
 *   receive - msgpack decode plus whatever it takes to get a dispatch-ready,
 *             typed message (`parseStdout` on the host, the read loop in the
 *             subprocess)
 *
 * `receive` is where the two differ most: `jsonrpc-lite` needs a separate
 * `parseObject()` pass that rebuilds and re-validates the message, while the
 * in-house codec hands back the envelope instance directly.
 *
 * Both contenders get their own encoder/decoder pair, exactly like the runtime
 * gives each subprocess its own (see the note in either `codec.ts`).
 */
import * as legacyJsonRpc from 'jsonrpc-lite';

import type { Fixture } from './fixtures';
import { newDecoder as newLegacyDecoder, newEncoder as newLegacyEncoder } from './legacyCodec';
import * as jsonrpc from '../../src/lib/jsonrpc';
import { newDecoder, newEncoder } from '../../src/server/runtime/base/codec';

/** A dispatch-ready message, flattened so the two contenders can be compared field by field. */
export type Normalized = {
	kind: 'request' | 'notification' | 'success' | 'error';
	id?: unknown;
	method?: string;
	params?: unknown;
	result?: unknown;
	error?: { message: string; code: number; data?: unknown };
};

export type Contender = {
	name: string;
	build(fixture: Fixture): unknown;
	encode(message: unknown): Uint8Array;
	receive(bytes: Uint8Array): unknown;
	normalize(received: unknown): Normalized;
};

export function createLegacyContender(): Contender {
	const encoder = newLegacyEncoder();
	const decoder = newLegacyDecoder();

	return {
		name: 'jsonrpc-lite',

		build(fixture) {
			switch (fixture.kind) {
				case 'request':
					return legacyJsonRpc.request(fixture.id, fixture.method, fixture.params as legacyJsonRpc.RpcParams);
				case 'notification':
					return legacyJsonRpc.notification(fixture.method, fixture.params as legacyJsonRpc.RpcParams);
				case 'success':
					return legacyJsonRpc.success(fixture.id, fixture.result as legacyJsonRpc.Defined);
				case 'error':
					return legacyJsonRpc.error(fixture.id, new legacyJsonRpc.JsonRpcError(fixture.message, fixture.code, fixture.data));
			}
		},

		encode(message) {
			return encoder.encode(message);
		},

		// The decoder yields a plain object, so the receiver still has to parse and
		// categorize it before it can dispatch.
		receive(bytes) {
			const parsed = legacyJsonRpc.parseObject(decoder.decode(bytes));

			if ((parsed.type as string) === 'invalid') {
				throw new Error(`jsonrpc-lite rejected the message: ${parsed.payload.message}`);
			}

			return parsed;
		},

		// Verification only, never timed: `RpcStatusType` is a `const enum`, which the
		// transpile-only loader cannot read at runtime, so we branch on the class instead.
		normalize(received) {
			const { payload } = received as legacyJsonRpc.IParsedObject;

			if (payload instanceof legacyJsonRpc.RequestObject) {
				return { kind: 'request', id: payload.id, method: payload.method, params: payload.params };
			}

			if (payload instanceof legacyJsonRpc.NotificationObject) {
				return { kind: 'notification', method: payload.method, params: payload.params };
			}

			if (payload instanceof legacyJsonRpc.SuccessObject) {
				return { kind: 'success', id: payload.id, result: payload.result };
			}

			if (payload instanceof legacyJsonRpc.ErrorObject) {
				const { id, error } = payload;
				return { kind: 'error', id, error: { message: error.message, code: error.code, data: error.data } };
			}

			throw new Error('jsonrpc-lite did not return a JSON-RPC message');
		},
	};
}

export function createInHouseContender(): Contender {
	const encoder = newEncoder();
	const decoder = newDecoder();

	return {
		name: 'in-house',

		build(fixture) {
			switch (fixture.kind) {
				case 'request':
					return jsonrpc.request(fixture.id, fixture.method, fixture.params as jsonrpc.RpcParams);
				case 'notification':
					return jsonrpc.notification(fixture.method, fixture.params as jsonrpc.RpcParams);
				case 'success':
					return jsonrpc.success(fixture.id, fixture.result as jsonrpc.Defined);
				case 'error':
					return jsonrpc.error(fixture.id, new jsonrpc.JsonRpcError(fixture.message, fixture.code, fixture.data));
			}
		},

		encode(message) {
			return encoder.encode(message);
		},

		// The codec's JSON-RPC extension rebuilds the envelope class, so the decoded
		// value is already the dispatch-ready message. There is no parse step.
		receive(bytes) {
			return decoder.decode(bytes);
		},

		normalize(received) {
			if (received instanceof jsonrpc.RequestObject) {
				return { kind: 'request', id: received.id, method: received.method, params: received.params };
			}

			if (received instanceof jsonrpc.NotificationObject) {
				return { kind: 'notification', method: received.method, params: received.params };
			}

			if (received instanceof jsonrpc.SuccessObject) {
				return { kind: 'success', id: received.id, result: received.result };
			}

			if (received instanceof jsonrpc.ErrorObject) {
				const { id, error } = received;
				return { kind: 'error', id, error: { message: error.message, code: error.code, data: error.data } };
			}

			throw new Error('the decoder returned something that is not a JSON-RPC message');
		},
	};
}
