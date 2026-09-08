/**
 * Minimal JSON-RPC 2.0 types and helpers for the apps runtime bridge.
 *
 * This is a purpose-built, dependency-free replacement for `jsonrpc-lite`. We
 * only need to build the handful of message shapes that cross the process
 * boundary between the Apps-Engine host and the app subprocess. Both sides
 * share this module: the host imports it directly, the app runtime through
 * `base-runtime/src/lib/jsonrpc`.
 *
 * Every message also carries an optional `meta` bag, analogous to HTTP headers
 * (see {@link JsonRpcMeta}).
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

export const JSONRPC_VERSION = '2.0';

/** The five error codes JSON-RPC 2.0 reserves. */
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;
export const PARSE_ERROR = -32700;

/** The generic code this bridge uses for an error raised by app or bridge code. */
export const SERVER_ERROR = -32000;

/**
 * The shape an error payload has on the wire. A decoded payload is one of these
 * and nothing more: msgpack rebuilds it as a plain map, so it carries no identity
 * of its own.
 */
export type SerializedJsonRpcError = {
	message: string;

	code: number;

	// `any` (rather than `unknown`) mirrors `jsonrpc-lite` and keeps call sites that
	// read/augment `data` (e.g. `error.data?.logs`, `data.logs = ...`) type-checking.
	data?: any;
};

/**
 * Intentionally NOT an `Error` subclass: its `message`/`code`/`data` must be own,
 * enumerable properties so msgpack serializes them across the process boundary (an
 * `Error`'s `message` is non-enumerable and would be dropped). That is also why
 * this class needs no `toJson()`, unlike its counterparts in `vscode-jsonrpc` and
 * `@metamask/rpc-errors`, which convert because they extend `Error`.
 */
export class JsonRpcError implements SerializedJsonRpcError {
	public message: string;

	public code: number;

	public declare data?: any;

	constructor(message: string, code: number, data?: any) {
		this.message = message;
		this.code = code;

		// `data` must stay ABSENT rather than present-and-undefined: msgpack
		// distinguishes the two.
		if (data !== undefined && data !== null) {
			this.data = data;
		}
	}

	static invalidRequest(data?: any): JsonRpcError {
		return new JsonRpcError('Invalid request', INVALID_REQUEST, data);
	}

	static methodNotFound(data?: any): JsonRpcError {
		return new JsonRpcError('Method not found', METHOD_NOT_FOUND, data);
	}

	static invalidParams(data?: any): JsonRpcError {
		return new JsonRpcError('Invalid params', INVALID_PARAMS, data);
	}

	static internalError(data?: any): JsonRpcError {
		return new JsonRpcError('Internal error', INTERNAL_ERROR, data);
	}

	static parseError(data?: any): JsonRpcError {
		return new JsonRpcError('Parse error', PARSE_ERROR, data);
	}
}

export type RequestObject = {
	jsonrpc: typeof JSONRPC_VERSION;
	id: ID;
	method: string;
	params?: RpcParams;
	meta?: JsonRpcMeta;
};

export type NotificationObject = {
	jsonrpc: typeof JSONRPC_VERSION;
	id?: undefined;
	method: string;
	params?: RpcParams;
	meta?: JsonRpcMeta;
};

export type SuccessObject = {
	jsonrpc: typeof JSONRPC_VERSION;
	id: ID;
	result: Defined;
	error?: undefined;
	meta?: JsonRpcMeta;
};

export type ErrorObject = {
	jsonrpc: typeof JSONRPC_VERSION;
	id: ID;
	error: SerializedJsonRpcError;
	result?: undefined;
	meta?: JsonRpcMeta;
};

export type JsonRpc = RequestObject | NotificationObject | SuccessObject | ErrorObject;

export function request(id: ID, method: string, params?: RpcParams, meta?: JsonRpcMeta): RequestObject {
	const message: RequestObject = { jsonrpc: JSONRPC_VERSION, id, method };

	// The optional slots must stay ABSENT rather than present-and-undefined, here
	// and in every factory below: msgpack distinguishes the two.
	if (params !== undefined) {
		message.params = params;
	}

	if (meta !== undefined) {
		message.meta = meta;
	}

	return message;
}

export function notification(method: string, params?: RpcParams, meta?: JsonRpcMeta): NotificationObject {
	const message: NotificationObject = { jsonrpc: JSONRPC_VERSION, method };

	if (params !== undefined) {
		message.params = params;
	}

	if (meta !== undefined) {
		message.meta = meta;
	}

	return message;
}

export function success(id: ID, result: Defined, meta?: JsonRpcMeta): SuccessObject {
	const message: SuccessObject = { jsonrpc: JSONRPC_VERSION, id, result };

	if (meta !== undefined) {
		message.meta = meta;
	}

	return message;
}

export function error(id: ID, err: SerializedJsonRpcError, meta?: JsonRpcMeta): ErrorObject {
	const message: ErrorObject = { jsonrpc: JSONRPC_VERSION, id, error: err };

	if (meta !== undefined) {
		message.meta = meta;
	}

	return message;
}

/**
 * Structural, and deliberately not exported. It only ever runs on the `error` slot
 * of a decoded envelope, where the payload has lost its identity and a shape test
 * is the only thing left. Use `instanceof JsonRpcError` in process.
 */
function isSerializedJsonRpcError(value: unknown): value is SerializedJsonRpcError {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as SerializedJsonRpcError).message === 'string' &&
		typeof (value as SerializedJsonRpcError).code === 'number'
	);
}

/** The `jsonrpc` property is the gate: one property read rejects a foreign object. */
function isEnvelope(message: unknown): message is JsonRpc {
	return typeof message === 'object' && message !== null && (message as JsonRpc).jsonrpc === JSONRPC_VERSION;
}

export function isRequestObject(message: unknown): message is RequestObject {
	return isEnvelope(message) && typeof (message as RequestObject).method === 'string' && 'id' in message;
}

export function isNotificationObject(message: unknown): message is NotificationObject {
	return isEnvelope(message) && typeof (message as NotificationObject).method === 'string' && !('id' in message);
}

export function isSuccessObject(message: unknown): message is SuccessObject {
	return isEnvelope(message) && 'result' in message;
}

export function isErrorObject(message: unknown): message is ErrorObject {
	return isEnvelope(message) && isSerializedJsonRpcError((message as ErrorObject).error);
}

export function isJsonRpc(message: unknown): message is JsonRpc {
	return isRequestObject(message) || isNotificationObject(message) || isSuccessObject(message) || isErrorObject(message);
}

const jsonrpc = {
	JsonRpcError,
	request,
	notification,
	success,
	error,
	isRequestObject,
	isNotificationObject,
	isSuccessObject,
	isErrorObject,
	isJsonRpc,
};

export default jsonrpc;
