import { writeAll } from "https://deno.land/std@0.216.0/io/write_all.ts";

import * as jsonrpc from 'jsonrpc-lite';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import type { Logger } from './logger.ts';
import { encoder } from './codec.ts';

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

export const RPCResponseObserver = new EventTarget();

export const Queue = new (class Queue {
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
                await Transport.send(message);
            }
        }

        this.isProcessing = false;
    }

    public enqueue(message: jsonrpc.JsonRpc | typeof COMMAND_PONG) {
        this.queue.push(encoder.encode(message));
        this.processQueue();
    }

    public getCurrentSize() {
        return this.queue.length;
    }
});

export const Transport = new (class Transporter {
    private selectedTransport: Transporter['stdoutTransport'] | Transporter['noopTransport'];

    constructor() {
        this.selectedTransport = this.stdoutTransport.bind(this);
    }

    private async stdoutTransport(message: Uint8Array): Promise<void> {
        await writeAll(Deno.stdout, message);
    }

    private async noopTransport(_message: Uint8Array): Promise<void> {}

    public selectTransport(transport: 'stdout' | 'noop'): void {
        switch (transport) {
            case 'stdout':
                this.selectedTransport = this.stdoutTransport.bind(this);
                break;
            case 'noop':
                this.selectedTransport = this.noopTransport.bind(this);
                break;
        }
    }

    public send(message: Uint8Array): Promise<void> {
        return this.selectedTransport(message);
    }
})();

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

export async function errorResponse({ error: { message, code = -32000, data = {} }, id }: ErrorResponseDescriptor): Promise<void> {
    const logger = AppObjectRegistry.get<Logger>('logger');

    if (logger?.hasEntries()) {
        data.logs = logger.getLogs();
    }

    const rpc = jsonrpc.error(id, new jsonrpc.JsonRpcError(message, code, data));

    await Queue.enqueue(rpc);
}

export async function successResponse({ id, result }: SuccessResponseDescriptor): Promise<void> {
    const payload = { value: result } as Record<string, unknown>;
    const logger = AppObjectRegistry.get<Logger>('logger');

    if (logger?.hasEntries()) {
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
        const handler = (event: Event) => {
            if (event instanceof ErrorEvent) {
                reject(event.error);
            }

            if (event instanceof CustomEvent) {
                resolve(event.detail);
            }

            RPCResponseObserver.removeEventListener(`response:${request.id}`, handler);
        };

        RPCResponseObserver.addEventListener(`response:${request.id}`, handler);
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
