/**
 * Minimal JSON-RPC 2.0 types and helpers for the apps runtime bridge.
 *
 * This is a purpose-built, dependency-free replacement for `jsonrpc-lite`. We
 * only need to build the handful of message shapes that cross the process
 * boundary between the Apps-Engine host and the app subprocess. Both sides
 * share this module: the host imports it directly, the app runtime through
 * `base-runtime/src/lib/jsonrpc`.
 *
 * Notably, this does NOT validate the messages it builds. `jsonrpc-lite` ran
 * `JSON.stringify` over every object it created just to assert it was
 * serializable, then threw the resulting string away. That is pure overhead
 * here: messages are serialized with msgpack, never with `JSON.stringify`, so
 * the check validated something we never do and rejected payloads (e.g.
 * `Buffer`s, circular-free but large graphs) that msgpack handles fine. The
 * factory helpers below simply construct the objects.
 *
 * The wire form is owned by the msgpack codecs on each side of the boundary
 * (`src/server/runtime/base/codec` and `base-runtime/src/lib/codec`): a
 * dedicated extension tags each of these classes on encode and rebuilds the
 * exact instance on decode. There is therefore no separate parse/
 * categorization step - the decoder yields ready-to-use instances on both
 * sides, and callers distinguish them with `instanceof`.
 *
 * Every message also carries an optional `meta` bag, analogous to HTTP headers
 * (see {@link JsonRpcMeta}).
 *
 * CAVEAT: `meta` does not cross the process boundary yet. Those codecs encode
 * each message as a positional tuple, and neither of them knows about the slot,
 * so a `meta` set on a message is dropped on encode. The two codecs are copies
 * of each other; the slot is added once they are unified into a single
 * definition. Until then `meta` is an in-process API only.
 */

export type ID = string | number | null;

export type Defined = string | number | boolean | object | null;

export type RpcParams = object | Defined[];

/**
 * Out-of-band metadata that travels with a message, analogous to HTTP headers:
 * the bridge carries these values and never interprets them. Use it for data
 * that describes the message rather than the operation it requests, e.g. a
 * trace id.
 *
 * The key set is open on purpose, because the properties we want are still
 * being defined. Declare a key here once its shape settles:
 *
 * ```ts
 * export type JsonRpcMeta = { traceId?: string } & { [key: string]: Defined | undefined };
 * ```
 */
export type JsonRpcMeta = {
	[key: string]: Defined | undefined;
};

const JSONRPC_VERSION = '2.0';

/**
 * A JSON-RPC 2.0 error payload. Intentionally NOT an `Error` subclass: its
 * `message`/`code`/`data` must be own, enumerable properties so msgpack
 * serializes them across the process boundary (an `Error`'s `message` is
 * non-enumerable and would be dropped).
 */
export class JsonRpcError {
	public message: string;

	public code: number;

	// `any` (rather than `unknown`) mirrors `jsonrpc-lite` and keeps call sites that
	// read/augment `data` (e.g. `error.data?.logs`, `data.logs = ...`) type-checking.
	public declare data?: any;

	constructor(message: string, code: number, data?: any) {
		this.message = message;
		this.code = code;

		if (data !== undefined && data !== null) {
			this.data = data;
		}
	}

	static invalidRequest(data?: any): JsonRpcError {
		return new JsonRpcError('Invalid request', -32600, data);
	}

	static methodNotFound(data?: any): JsonRpcError {
		return new JsonRpcError('Method not found', -32601, data);
	}

	static invalidParams(data?: any): JsonRpcError {
		return new JsonRpcError('Invalid params', -32602, data);
	}

	static internalError(data?: any): JsonRpcError {
		return new JsonRpcError('Internal error', -32603, data);
	}

	static parseError(data?: any): JsonRpcError {
		return new JsonRpcError('Parse error', -32700, data);
	}
}

export class RequestObject {
	public jsonrpc = JSONRPC_VERSION;

	public id: ID;

	public method: string;

	public declare params?: RpcParams;

	public declare meta?: JsonRpcMeta;

	constructor(id: ID, method: string, params?: RpcParams, meta?: JsonRpcMeta) {
		this.id = id;
		this.method = method;

		if (params !== undefined) {
			this.params = params;
		}

		if (meta !== undefined) {
			this.meta = meta;
		}
	}
}

export class NotificationObject {
	public jsonrpc = JSONRPC_VERSION;

	public method: string;

	public declare params?: RpcParams;

	public declare meta?: JsonRpcMeta;

	constructor(method: string, params?: RpcParams, meta?: JsonRpcMeta) {
		this.method = method;

		if (params !== undefined) {
			this.params = params;
		}

		if (meta !== undefined) {
			this.meta = meta;
		}
	}
}

export class SuccessObject {
	public jsonrpc = JSONRPC_VERSION;

	public id: ID;

	public result: Defined;

	public declare meta?: JsonRpcMeta;

	constructor(id: ID, result: Defined, meta?: JsonRpcMeta) {
		this.id = id;
		this.result = result;

		if (meta !== undefined) {
			this.meta = meta;
		}
	}
}

export class ErrorObject {
	public jsonrpc = JSONRPC_VERSION;

	public id: ID;

	public error: JsonRpcError;

	public declare meta?: JsonRpcMeta;

	constructor(id: ID, error: JsonRpcError, meta?: JsonRpcMeta) {
		this.id = id;
		this.error = error;

		if (meta !== undefined) {
			this.meta = meta;
		}
	}
}

export type JsonRpc = RequestObject | NotificationObject | SuccessObject | ErrorObject;

export function request(id: ID, method: string, params?: RpcParams, meta?: JsonRpcMeta): RequestObject {
	return new RequestObject(id, method, params, meta);
}

export function notification(method: string, params?: RpcParams, meta?: JsonRpcMeta): NotificationObject {
	return new NotificationObject(method, params, meta);
}

export function success(id: ID, result: Defined, meta?: JsonRpcMeta): SuccessObject {
	return new SuccessObject(id, result, meta);
}

export function error(id: ID, err: JsonRpcError, meta?: JsonRpcMeta): ErrorObject {
	return new ErrorObject(id, err, meta);
}

const jsonrpc = {
	JsonRpcError,
	request,
	notification,
	success,
	error,
};

export default jsonrpc;
