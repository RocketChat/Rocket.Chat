import { Emitter } from '@rocket.chat/emitter';

import type { ConnectedPayload, ConnectPayload, FailedPayload } from './types/ConnectingPayload';
import type { PingPayload, PongPayload } from './types/HeartbeatPayloads';
import type { MethodPayload, ResultPayload, ServerMethodPayloads } from './types/MethodPayloads';
import type { ClientPublicationPayloads, ServerPublicationPayloads, SubscribePayload, UnsubscribePayload } from './types/PublishPayloads';

/* This class was created to be used together with the WebSocket class.
 * It is responsible for low-level communication with the server.
 * It is responsible for sending and receiving messages.
 * It does not provide any procedures for connecting or reconnecting.
 * It does not provide any procedure to handle collections.
 * example:
 *  const socket = new WebSocket('ws://localhost:3000/websocket');
 * const ddp = new ClassMinimalDDPClient(socket.send.bind(socket));
 * socket.onmessage = (event) => {
 *  ddp.handleMessage(event.data);
 * };
 * ddp.sendSerialized({ msg: 'connect', version: '1', support: ['pre1'] });
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DDPMethods {
	// Returns a string representation of an RPC method call
	// Parameters
	//   method: the RPC method to call
	//   ...params: the parameters to the RPC method
	// Returns
	//   a string representation of an RPC method call
	call: (method: string, ...params: any[]) => string;

	// This function is part of the PubSub module.
	// It is used to subscribe to a message queue.
	// The name is the name of the queue to subscribe to, and the params are any parameters that the queue takes.
	// It returns a string representing a subscription id.
	subscribe: (name: string, ...params: any[]) => string;

	// This function is part of the PubSub module.
	// This function is responsible for unsubscribing from a stream.
	// The function takes an id as an argument.
	// The function does not return any value.
	// The function is called when we want to unsubscribe from a stream.
	unsubscribe: (id: string) => void;

	sendSerialized: (msg: MessagePayload) => void;
	// This code uses a callback to handle messages.
	// The handleMessage function is called whenever a message is received.
	handleMessage: (msg: string) => void;

	// Send the connect message to the server
	connect: () => void;

	// this function is called once after the subscription is ready or rejected
	onPublish: (name: string, callback: (payload: ServerPublicationPayloads) => void) => RemoveListener;
	// this function is called once after the method is resolved or rejected
	onResult: (id: string, callback: (payload: ResultPayload) => void) => RemoveListener;
	// this function is called every time the subscription is updated
	onUpdate: (id: string, callback: (payload: ServerMethodPayloads) => void) => RemoveListener;
	// this function is called once after the subscription is stopped
	onNoSub: (id: string, callback: (payload: ServerMethodPayloads) => void) => RemoveListener;
	// this function is called every time a new document is added/updated/removed from the collection
	onCollection: (name: string, callback: (payload: ServerPublicationPayloads) => void) => RemoveListener;
	// this function is called once after the connection is established or rejected
	onConnection: (callback: (payload: ConnectedPayload | FailedPayload) => void) => RemoveListener;
}

type MessagePayload = PingPayload | PongPayload | ConnectPayload | ClientPublicationPayloads | MethodPayload;

type MessageHandlerPayload =
	| PingPayload
	| PongPayload
	| ServerPublicationPayloads
	| ServerMethodPayloads
	| ConnectedPayload
	| FailedPayload
	| SubscribePayload
	| UnsubscribePayload;

/**
 * Creates a unique id for a DDP client.
 * @returns {string} - A unique id for a DDP client.
 */
const getUniqueId = (() => {
	let id = 0;
	return () => `rc-ddp-client-${++id}`;
})();

const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

type RemoveListener = () => void;

export class ClassMinimalDDPClient extends Emitter implements DDPMethods {
	constructor(readonly send: (params: string) => void, readonly encode = JSON.stringify, readonly decode = JSON.parse) {
		super();
	}

	handleMessage(payload: string) {
		const data = this.decode(payload) as MessageHandlerPayload;

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

	sendSerialized(payload: MessagePayload) {
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

	unsubscribe(id: string) {
		const payload: UnsubscribePayload = {
			msg: 'unsub',
			id,
		};
		this.sendSerialized(payload);
		return id;
	}

	connect() {
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
}
