import EventEmitter from 'node:events';

import { sanitizeForIpc } from '@rocket.chat/apps/dist/lib/IpcSanitizer';

import * as jsonrpc from './jsonrpc';
import type { RequestContext } from './requestContext';

export type RequestDescriptor = Pick<jsonrpc.RequestObject, 'method' | 'params' | 'meta'>;

export type NotificationDescriptor = Pick<jsonrpc.NotificationObject, 'method' | 'params' | 'meta'>;

export type SuccessResponseDescriptor = Pick<jsonrpc.SuccessObject, 'id' | 'result' | 'meta'>;

export type ErrorResponseDescriptor = Pick<jsonrpc.ErrorObject, 'id' | 'error' | 'meta'>;

export type JsonRpcRequest = jsonrpc.RequestObject | jsonrpc.NotificationObject;
export type JsonRpcResponse = jsonrpc.SuccessObject | jsonrpc.ErrorObject;

export function isRequest(message: jsonrpc.JsonRpc): message is JsonRpcRequest {
	return jsonrpc.isRequestObject(message) || jsonrpc.isNotificationObject(message);
}

export function isResponse(message: jsonrpc.JsonRpc): message is JsonRpcResponse {
	return jsonrpc.isSuccessObject(message) || jsonrpc.isErrorObject(message);
}

// Takes `unknown` because `parseMessage` throws an `ErrorObject`, so the main loop
// tests a caught value with this.
export function isErrorResponse(message: unknown): message is jsonrpc.ErrorObject {
	return jsonrpc.isErrorObject(message);
}

const COMMAND_PONG = '_zPONG';

export const RPCResponseObserver = new EventEmitter();

/**
 * The IPC channel connecting this runtime to the host process that spawned it.
 *
 * The channel serializes messages with V8's structured clone algorithm, which
 * throws on functions and other non-cloneable values an app might return, so
 * every message is sanitized before being handed to Node.
 */
export const ipcChannel = {
	send(message: jsonrpc.JsonRpc | typeof COMMAND_PONG): Promise<void> {
		return new Promise((resolve, reject) => {
			if (typeof process.send !== 'function') {
				reject(new Error('No IPC channel available to communicate with the host process'));
				return;
			}

			process.send(sanitizeForIpc(message), undefined, undefined, (error) => (error ? reject(error) : resolve()));
		});
	},
};

export function parseMessage(message: unknown): jsonrpc.JsonRpc {
	if (jsonrpc.isJsonRpc(message)) {
		return message;
	}

	throw jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(message));
}

export async function sendInvalidRequestError(): Promise<void> {
	const rpc = jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(null));

	await ipcChannel.send(rpc);
}

export async function sendInvalidParamsError(id: jsonrpc.ID): Promise<void> {
	const rpc = jsonrpc.error(id, jsonrpc.JsonRpcError.invalidParams(null));

	await ipcChannel.send(rpc);
}

export async function sendParseError(): Promise<void> {
	const rpc = jsonrpc.error(null, jsonrpc.JsonRpcError.parseError(null));

	await ipcChannel.send(rpc);
}

export async function sendMethodNotFound(id: jsonrpc.ID): Promise<void> {
	const rpc = jsonrpc.error(id, jsonrpc.JsonRpcError.methodNotFound(null));

	await ipcChannel.send(rpc);
}

export async function errorResponse(
	{ error: { message, code = -32000, data = {} }, id, meta }: ErrorResponseDescriptor,
	req?: RequestContext,
): Promise<void> {
	const { logger } = req?.context || {};

	if (logger?.hasEntries()) {
		data.logs = logger.getLogs();
	}

	const rpc = jsonrpc.error(id, new jsonrpc.JsonRpcError(message, code, data), meta);

	await ipcChannel.send(rpc);
}

export async function successResponse({ id, result, meta }: SuccessResponseDescriptor, req: RequestContext): Promise<void> {
	const payload = { value: result } as Record<string, unknown>;
	const { logger } = req.context;

	if (logger.hasEntries()) {
		payload.logs = logger.getLogs();
	}

	const rpc = jsonrpc.success(id, payload, meta);

	await ipcChannel.send(rpc);
}

export function pongResponse(): Promise<void> {
	return ipcChannel.send(COMMAND_PONG);
}

export async function sendRequest(requestDescriptor: RequestDescriptor): Promise<jsonrpc.SuccessObject> {
	const request = jsonrpc.request(
		Math.random().toString(36).slice(2),
		requestDescriptor.method,
		requestDescriptor.params,
		requestDescriptor.meta,
	);

	// TODO: add timeout to this
	const responsePromise = new Promise((resolve, reject) => {
		const handler = (payload: { error: Error } | { detail: jsonrpc.SuccessObject }) => {
			if ('error' in payload) {
				return reject(payload.error);
			}

			return resolve(payload.detail);
		};

		RPCResponseObserver.once(`response:${request.id}`, handler);
	});

	await ipcChannel.send(request);

	return responsePromise as Promise<jsonrpc.SuccessObject>;
}

export function sendNotification({ method, params, meta }: NotificationDescriptor) {
	const request = jsonrpc.notification(method, params, meta);

	void ipcChannel.send(request);
}

export function log(params: jsonrpc.RpcParams) {
	sendNotification({ method: 'log', params });
}
