/**
 * Minimal JSON-RPC 2.0 types and helpers for the apps runtime bridge.
 *
 * This is a purpose-built, dependency-free replacement for `jsonrpc-lite`. We
 * only need to build and categorize the handful of message shapes that cross
 * the process boundary between the Apps-Engine host and the app subprocess.
 *
 * Notably, this does NOT validate the messages it builds. `jsonrpc-lite` ran
 * `JSON.stringify` over every object it created just to assert it was
 * serializable, then threw the resulting string away. That is pure overhead
 * here: messages are serialized with msgpack (see `./codec`), never with
 * `JSON.stringify`, so the check validated something we never do and rejected
 * payloads (e.g. `Buffer`s, circular-free but large graphs) that msgpack
 * handles fine. The factory helpers below simply construct the objects.
 */

export type ID = string | number | null;

export type Defined = string | number | boolean | object | null;

export type RpcParams = object | Defined[];

export type RpcStatusType = 'request' | 'notification' | 'success' | 'error' | 'invalid';

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
	declare public data?: any;

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

	declare public params?: RpcParams;

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

	declare public params?: RpcParams;

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

export interface IParsedObjectRequest {
	type: 'request';
	payload: RequestObject;
}

export interface IParsedObjectNotification {
	type: 'notification';
	payload: NotificationObject;
}

export interface IParsedObjectSuccess {
	type: 'success';
	payload: SuccessObject;
}

export interface IParsedObjectError {
	type: 'error';
	payload: ErrorObject;
}

export interface IParsedObjectInvalid {
	type: 'invalid';
	payload: JsonRpcError;
}

export type IParsedObject =
	| IParsedObjectRequest
	| IParsedObjectNotification
	| IParsedObjectSuccess
	| IParsedObjectError
	| IParsedObjectInvalid;

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

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Categorizes a decoded JSON-RPC 2.0 object into one of the message shapes and
 * rebuilds it as the matching class instance (so `instanceof` checks work after
 * a msgpack round-trip). This mirrors `jsonrpc-lite`'s categorization but drops
 * the per-field validation it performed.
 */
export function parseObject(obj: any): IParsedObject {
	if (obj == null || obj.jsonrpc !== JSONRPC_VERSION) {
		return { type: 'invalid', payload: JsonRpcError.invalidRequest(obj) };
	}

	if (!hasOwnProperty.call(obj, 'id')) {
		return { type: 'notification', payload: new NotificationObject(obj.method, obj.params) };
	}

	if (hasOwnProperty.call(obj, 'method')) {
		return { type: 'request', payload: new RequestObject(obj.id, obj.method, obj.params) };
	}

	if (hasOwnProperty.call(obj, 'result')) {
		return { type: 'success', payload: new SuccessObject(obj.id, obj.result) };
	}

	if (hasOwnProperty.call(obj, 'error')) {
		if (obj.error == null) {
			return { type: 'invalid', payload: JsonRpcError.internalError(obj) };
		}

		const err = new JsonRpcError(obj.error.message, obj.error.code, obj.error.data);
		return { type: 'error', payload: new ErrorObject(obj.id, err) };
	}

	return { type: 'invalid', payload: JsonRpcError.invalidRequest(obj) };
}

export function parse(message: string): IParsedObject | IParsedObject[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(message);
	} catch {
		return { type: 'invalid', payload: JsonRpcError.parseError(message) };
	}

	if (Array.isArray(parsed)) {
		return parsed.map(parseObject);
	}

	return parseObject(parsed);
}

const jsonrpc = {
	JsonRpcError,
	request,
	notification,
	success,
	error,
	parse,
	parseObject,
};

export default jsonrpc;
