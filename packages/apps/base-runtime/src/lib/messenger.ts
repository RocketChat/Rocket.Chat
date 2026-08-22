import EventEmitter from 'node:events';

import { encoder } from './codec';
import * as jsonrpc from './jsonrpc';
import type { RequestContext } from './requestContext';

export type RequestDescriptor = Pick<jsonrpc.RequestObject, 'method' | 'params'>;

export type NotificationDescriptor = Pick<jsonrpc.NotificationObject, 'method' | 'params'>;

export type SuccessResponseDescriptor = Pick<jsonrpc.SuccessObject, 'id' | 'result'>;

export type ErrorResponseDescriptor = Pick<jsonrpc.ErrorObject, 'id' | 'error'>;

export type JsonRpcRequest = jsonrpc.RequestObject | jsonrpc.NotificationObject;
export type JsonRpcResponse = jsonrpc.SuccessObject | jsonrpc.ErrorObject;

export function isRequest(message: jsonrpc.JsonRpc): message is JsonRpcRequest {
	return message instanceof jsonrpc.RequestObject || message instanceof jsonrpc.NotificationObject;
}

export function isResponse(message: jsonrpc.JsonRpc): message is JsonRpcResponse {
	return message instanceof jsonrpc.SuccessObject || message instanceof jsonrpc.ErrorObject;
}

export function isErrorResponse(message: jsonrpc.JsonRpc): message is jsonrpc.ErrorObject {
	return message instanceof jsonrpc.ErrorObject;
}

const COMMAND_PONG = '_zPONG';

export const RPCResponseObserver = new EventEmitter();

class MessageQueue {
	private queue: Uint8Array[] = [];

	private isProcessing = false;

	private async processQueue() {
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;

		while (this.queue.length) {
			const message = this.queue.shift();

			if (message) {
				await transport.send(message);
			}
		}

		this.isProcessing = false;
	}

	public enqueue(message: jsonrpc.JsonRpc | typeof COMMAND_PONG) {
		this.queue.push(encoder.encode(message));
		void this.processQueue();
	}

	public getCurrentSize() {
		return this.queue.length;
	}
}

export const Queue = new MessageQueue();

/**
 * A platform-dependent component responsible for delivering encoded messages to
 * the host that controls this runtime.
 *
 * Each runtime platform is expected to provide its own implementation and
 * inject it via {@link setTransport}.
 */
export type Transport = {
	send(message: Uint8Array): Promise<void>;
};

/**
 * The default transport. It discards every message, and is used until a
 * platform injects its own transport via {@link setTransport}.
 */
export const noopTransport: Transport = {
	send: () => Promise.resolve(),
};

let transport: Transport = noopTransport;

/**
 * Injects the transport implementation to be used when sending messages.
 *
 * Platforms must call this during bootstrap to wire up the appropriate
 * transport. Until then, messages are discarded by the default no-op transport.
 */
export function setTransport(newTransport: Transport): void {
	transport = newTransport;
}

export function parseMessage(message: unknown): jsonrpc.JsonRpc {
	// The codec's JSON-RPC extension has already rebuilt the envelope classes on decode;
	// anything that is not one of them is not a valid message for this bridge.
	if (
		message instanceof jsonrpc.RequestObject ||
		message instanceof jsonrpc.NotificationObject ||
		message instanceof jsonrpc.SuccessObject ||
		message instanceof jsonrpc.ErrorObject
	) {
		return message;
	}

	throw jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(message));
}

export async function sendInvalidRequestError(): Promise<void> {
	const rpc = jsonrpc.error(null, jsonrpc.JsonRpcError.invalidRequest(null));

	await Queue.enqueue(rpc);
}

export async function sendInvalidParamsError(id: jsonrpc.ID): Promise<void> {
	const rpc = jsonrpc.error(id, jsonrpc.JsonRpcError.invalidParams(null));

	await Queue.enqueue(rpc);
}

export async function sendParseError(): Promise<void> {
	const rpc = jsonrpc.error(null, jsonrpc.JsonRpcError.parseError(null));

	await Queue.enqueue(rpc);
}

export async function sendMethodNotFound(id: jsonrpc.ID): Promise<void> {
	const rpc = jsonrpc.error(id, jsonrpc.JsonRpcError.methodNotFound(null));

	await Queue.enqueue(rpc);
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

	await Queue.enqueue(rpc);
}

export async function successResponse({ id, result }: SuccessResponseDescriptor, req: RequestContext): Promise<void> {
	const payload = { value: result } as Record<string, unknown>;
	const { logger } = req.context;

	if (logger.hasEntries()) {
		payload.logs = logger.getLogs();
	}

	const rpc = jsonrpc.success(id, payload);

	await Queue.enqueue(rpc);
}

export function pongResponse(): Promise<void> {
	return Promise.resolve(Queue.enqueue(COMMAND_PONG));
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

	await Queue.enqueue(request);

	return responsePromise as Promise<jsonrpc.SuccessObject>;
}

export function sendNotification({ method, params }: NotificationDescriptor) {
	const request = jsonrpc.notification(method, params);

	Queue.enqueue(request);
}

export function log(params: jsonrpc.RpcParams) {
	sendNotification({ method: 'log', params });
}
