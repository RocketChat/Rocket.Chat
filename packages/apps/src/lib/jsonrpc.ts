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
 */

export type ID = string | number | null;

export type Defined = string | number | boolean | object | null;

export type RpcParams = object | Defined[];

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

	constructor(id: ID, method: string, params?: RpcParams) {
		this.id = id;
		this.method = method;

		if (params !== undefined) {
			this.params = params;
		}
	}
}

export class NotificationObject {
	public jsonrpc = JSONRPC_VERSION;

	public method: string;

	public declare params?: RpcParams;

	constructor(method: string, params?: RpcParams) {
		this.method = method;

		if (params !== undefined) {
			this.params = params;
		}
	}
}

export class SuccessObject {
	public jsonrpc = JSONRPC_VERSION;

	public id: ID;

	public result: Defined;

	constructor(id: ID, result: Defined) {
		this.id = id;
		this.result = result;
	}
}

export class ErrorObject {
	public jsonrpc = JSONRPC_VERSION;

	public id: ID;

	public error: JsonRpcError;

	constructor(id: ID, error: JsonRpcError) {
		this.id = id;
		this.error = error;
	}
}

export type JsonRpc = RequestObject | NotificationObject | SuccessObject | ErrorObject;

export function request(id: ID, method: string, params?: RpcParams): RequestObject {
	return new RequestObject(id, method, params);
}

export function notification(method: string, params?: RpcParams): NotificationObject {
	return new NotificationObject(method, params);
}

export function success(id: ID, result: Defined): SuccessObject {
	return new SuccessObject(id, result);
}

export function error(id: ID, err: JsonRpcError): ErrorObject {
	return new ErrorObject(id, err);
}

const jsonrpc = {
	JsonRpcError,
	request,
	notification,
	success,
	error,
};

export default jsonrpc;
