import EventEmitter from 'node:events';

import { sanitizeForIpc } from '@rocket.chat/apps/dist/lib/IpcSanitizer';
import * as jsonrpc from 'jsonrpc-lite';

import type { RequestContext } from './requestContext';

export type RequestDescriptor = Pick<jsonrpc.RequestObject, 'method' | 'params'>;

export type NotificationDescriptor = Pick<jsonrpc.NotificationObject, 'method' | 'params'>;

export type SuccessResponseDescriptor = Pick<jsonrpc.SuccessObject, 'id' | 'result'>;

export type ErrorResponseDescriptor = Pick<jsonrpc.ErrorObject, 'id' | 'error'>;

export type JsonRpcRequest = jsonrpc.IParsedObjectRequest | jsonrpc.IParsedObjectNotification;
export type JsonRpcResponse = jsonrpc.IParsedObjectSuccess | jsonrpc.IParsedObjectError;

export function isRequest(message: jsonrpc.IParsedObject): message is JsonRpcRequest {
	return message.type === 'request' || message.type === 'notification';
}

export function isResponse(message: jsonrpc.IParsedObject): message is JsonRpcResponse {
	return message.type === 'success' || message.type === 'error';
}

export function isErrorResponse(message: jsonrpc.JsonRpc): message is jsonrpc.ErrorObject {
	return message instanceof jsonrpc.ErrorObject;
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

export function parseMessage(message: string | Record<string, unknown>) {
	let parsed: jsonrpc.IParsedObject | jsonrpc.IParsedObject[];

	if (typeof message === 'string') {
		parsed = jsonrpc.parse(message);
	} else {
		parsed = jsonrpc.parseObject(message);
	}

	if (Array.isArray(parsed)) {
		throw jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(null));
	}

	if (parsed.type === 'invalid') {
		throw jsonrpc.error(null, parsed.payload);
	}

	return parsed;
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
	{ error: { message, code = -32000, data = {} }, id }: ErrorResponseDescriptor,
	req?: RequestContext,
): Promise<void> {
	const { logger } = req?.context || {};

	if (logger?.hasEntries()) {
		data.logs = logger.getLogs();
	}

	const rpc = jsonrpc.error(id, new jsonrpc.JsonRpcError(message, code, data));

	await ipcChannel.send(rpc);
}

export async function successResponse({ id, result }: SuccessResponseDescriptor, req: RequestContext): Promise<void> {
	const payload = { value: result } as Record<string, unknown>;
	const { logger } = req.context;

	if (logger.hasEntries()) {
		payload.logs = logger.getLogs();
	}

	const rpc = jsonrpc.success(id, payload);

	await ipcChannel.send(rpc);
}

export function pongResponse(): Promise<void> {
	return ipcChannel.send(COMMAND_PONG);
}

export async function sendRequest(requestDescriptor: RequestDescriptor): Promise<jsonrpc.SuccessObject> {
	const request = jsonrpc.request(Math.random().toString(36).slice(2), requestDescriptor.method, requestDescriptor.params);

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

export function sendNotification({ method, params }: NotificationDescriptor) {
	const request = jsonrpc.notification(method, params);

	void ipcChannel.send(request);
}

export function log(params: jsonrpc.RpcParams) {
	sendNotification({ method: 'log', params });
}
