/**
 * The three pipelines under test.
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
 * The contenders are:
 *
 *   `jsonrpc-lite`      - the pipeline as it was: the library's factories, a
 *                         codec without a JSON-RPC extension, and `parseObject()`
 *                         on receive
 *   `in-house, no ext`  - the in-house types over that same extension-less codec.
 *                         The envelope goes on the wire as a plain map and a
 *                         small `hydrate()` rebuilds the class on receive
 *   `in-house`          - the pipeline as it ships: the in-house types over the
 *                         codec's JSON-RPC extension, which tags the envelope as
 *                         a positional tuple and returns the instance directly
 *
 * The first two differ only in the types. The last two differ only in the
 * extension, which is what isolates its cost.
 *
 * Every contender gets its own encoder/decoder pair, exactly like the runtime
 * gives each subprocess its own (see the note in either `codec.ts`).
 */
import * as legacyJsonRpc from 'jsonrpc-lite';

import type { Fixture } from './fixtures';
import { newDecoder as newPlainDecoder, newEncoder as newPlainEncoder } from './noExtensionCodec';
import * as jsonrpc from '../../src/lib/jsonrpc';
import { newDecoder, newEncoder } from '../../src/server/runtime/base/codec';

/** A dispatch-ready message, flattened so the contenders can be compared field by field. */
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
	const encoder = newPlainEncoder();
	const decoder = newPlainDecoder();

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

/** Shared by both in-house contenders: only the wire form below them differs. */
function buildInHouse(fixture: Fixture): unknown {
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
}

function normalizeInHouse(received: unknown): Normalized {
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
}

/**
 * What the receiver needs without the codec extension: the decoded value is a
 * plain map, and the dispatch sites branch with `instanceof`, so the envelope
 * class has to be rebuilt here.
 *
 * This is the cheapest form that still hands back the same instances - one field
 * test per branch, no validation, no copy of `params`. `jsonrpc-lite`'s
 * `parseObject()` does considerably more. What the extension does not beat here,
 * it does not beat at all.
 */
function hydrate(value: unknown): jsonrpc.JsonRpc {
	const message = value as {
		id?: jsonrpc.ID;
		method?: string;
		params?: jsonrpc.RpcParams;
		result?: jsonrpc.Defined;
		error?: { message: string; code: number; data?: unknown };
	};

	if (message.method !== undefined) {
		return 'id' in message
			? new jsonrpc.RequestObject(message.id, message.method, message.params)
			: new jsonrpc.NotificationObject(message.method, message.params);
	}

	if (message.error !== undefined) {
		const { message: text, code, data } = message.error;

		return new jsonrpc.ErrorObject(message.id, new jsonrpc.JsonRpcError(text, code, data));
	}

	return new jsonrpc.SuccessObject(message.id, message.result);
}

export function createNoExtensionContender(): Contender {
	const encoder = newPlainEncoder();
	const decoder = newPlainDecoder();

	return {
		name: 'in-house, no ext',

		build: buildInHouse,

		encode(message) {
			return encoder.encode(message);
		},

		receive(bytes) {
			return hydrate(decoder.decode(bytes));
		},

		normalize: normalizeInHouse,
	};
}

export function createInHouseContender(): Contender {
	const encoder = newEncoder();
	const decoder = newDecoder();

	return {
		name: 'in-house',

		build: buildInHouse,

		encode(message) {
			return encoder.encode(message);
		},

		// The codec's JSON-RPC extension rebuilds the envelope class, so the decoded
		// value is already the dispatch-ready message. There is no parse step.
		receive(bytes) {
			return decoder.decode(bytes);
		},

		normalize: normalizeInHouse,
	};
}
