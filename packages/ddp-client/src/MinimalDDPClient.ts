import { Emitter } from '@rocket.chat/emitter';

import type { ConnectedPayload, ConnectPayload, FailedPayload } from './types/connectionPayloads';
import type { MethodPayload, ResultPayload, ServerMethodPayloads } from './types/methodsPayloads';
import type { ServerPublicationPayloads, SubscribePayload, UnsubscribePayload } from './types/publicationPayloads';
import type { OutgoingPayload } from './types/OutgoingPayload';
import type { IncomingPayload } from './types/IncomingPayload';
import type { DDPClient } from './DDPClient';
import type { RemoveListener } from './types/RemoveListener';

/**
 * Creates a unique id for a DDP client.
 * @returns {string} - A unique id for a DDP client.
 */
const getUniqueId = (() => {
	let id = 0;
	return () => `rc-ddp-client-${++id}`;
})();

const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

/**
 * This class was created to be used together with the `WebSocket` class.
 * It is responsible for low-level communication with the server.
 * It is responsible for sending and receiving messages.
 * It does not provide any procedures for connecting or reconnecting.
 * It does not provide any procedure to handle collections.
 * @example
 * ```ts
 * const socket = new WebSocket('ws://localhost:3000/websocket');
 * const ddp = new MinimalDDPClient(socket.send.bind(socket));
 * socket.onmessage = (event) => {
 * 	ddp.handleMessage(event.data);
 * };
 * ddp.sendSerialized({ msg: 'connect', version: '1', support: ['pre1'] });
 * ```
 */
export class MinimalDDPClient extends Emitter implements DDPClient {
	constructor(readonly send: (params: string) => void, readonly encode = JSON.stringify, readonly decode = JSON.parse) {
		super();
	}

	handleMessage(payload: string): void {
		const data = this.decode(payload) as IncomingPayload;

		switch (data.msg) {
			case 'ping':
				this.sendSerialized({ msg: 'pong', ...(data.id && { id: data.id }) });
				break;
			case 'pong':
				this.emit('pong', data);
				break;

			// Streamer related messages

			case 'nosub':
				this.emit(`publication/${data.id}`, data);
				this.emit(`nosub/${data.id}`, data);
				break;
			case 'ready':
				data.subs.forEach((id) => {
					this.emit(`publication/${id}`, { msg: 'ready', id });
				});
				break;
			case 'added':
			case 'changed':
			case 'removed':
				this.emit(`collection/${data.collection}`, data);
				break;

			// DDP/RCP related messages

			case 'result':
				this.emit(`result/${data.id}`, data);
				break;
			case 'updated':
				data.methods.forEach((id) => {
					this.emit(`updated/${id}`, data);
				});
				break;

			case 'connected':
			case 'failed':
				this.emit('connection', data);
				break;
			default:
				throw new Error(`Unknown message type: ${data}`);
		}
		this.emit('message', data);
	}

	sendSerialized(payload: OutgoingPayload): void {
		this.send(this.encode(payload));
		this.emit('send', payload);
	}

	call(method: string, ...params: any[]): string {
		const id = getUniqueId();
		const payload: MethodPayload = {
			msg: 'method',
			method,
			params,
			id,
		};
		this.sendSerialized(payload);
		return id;
	}

	subscribe(name: string, ...params: any[]): string {
		const id = getUniqueId();
		const payload: SubscribePayload = {
			msg: 'sub',
			id,
			name,
			params,
		};
		this.sendSerialized(payload);
		return id;
	}

	unsubscribe(id: string): void {
		const payload: UnsubscribePayload = {
			msg: 'unsub',
			id,
		};
		this.sendSerialized(payload);
	}

	connect(): void {
		const payload: ConnectPayload = {
			msg: 'connect',
			version: '1',
			support: SUPPORTED_DDP_VERSIONS,
		};
		this.sendSerialized(payload);
	}

	onPublish(name: string, callback: (payload: ServerPublicationPayloads) => void): RemoveListener {
		return this.once(`publication/${name}`, callback);
	}

	onResult(id: string, callback: (payload: ResultPayload) => void): RemoveListener {
		return this.once(`result/${id}`, callback);
	}

	onUpdate(id: string, callback: (payload: ServerMethodPayloads) => void): RemoveListener {
		return this.on(`updated/${id}`, callback);
	}

	onNoSub(id: string, callback: (payload: ServerMethodPayloads) => void): RemoveListener {
		return this.once(`nosub/${id}`, callback);
	}

	onCollection(name: string, callback: (payload: ServerPublicationPayloads) => void): RemoveListener {
		return this.on(`collection/${name}`, callback);
	}

	onConnection(callback: (payload: ConnectedPayload | FailedPayload) => void): RemoveListener {
		return this.once('connection', callback);
	}

	onceMessage(callback: (payload: IncomingPayload) => void): RemoveListener {
		return this.once('message', callback);
	}

	onMessage(callback: (payload: IncomingPayload) => void): RemoveListener {
		return this.on('message', callback);
	}
}
