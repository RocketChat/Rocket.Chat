import { Emitter } from '@rocket.chat/emitter';

import type { PingPayload, PongPayload } from './HeartbeatPayloads';
import type { MethodPayload, ServerMethodPayloads } from './MethodPayloads';
import type { ClientPublicationPayloads, ServerPublicationPayloads, SubscribePayload, UnsubscribePayload } from './PublishPayloads';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DDPClient extends Emitter {
	call: (method: string, ...params: any[]) => string;
	subscribe: (name: string, ...params: any[]) => string;
	unsubscribe: (id: string) => void;

	sendSerialized: (msg: MessagePayload) => void;
	handleMessage: (msg: string) => void;
}

type ClientOptions = {
	url: string;
	SocketConstructor?: typeof WebSocket;
};

const getUniqueId = (() => {
	let id = 0;
	return () => `rc-ddp-client-${++id}`;
})();

const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

type ConnectPayload = {
	msg: 'connect';
	version: string;
	support: string[];
};

type MessagePayload = PingPayload | PongPayload | ConnectPayload | ClientPublicationPayloads | MethodPayload;

type MessageHandlerPayload = PingPayload | PongPayload | ServerPublicationPayloads | ServerMethodPayloads;

export class ClassMinimalDDPClient extends Emitter implements DDPClient {
	constructor(readonly send: (params: string) => void, readonly encode = JSON.stringify, readonly decode = JSON.parse) {
		super();
	}

	handleMessage(payload: string) {
		const data = this.decode(payload) as MessageHandlerPayload;

		switch (data.msg) {
			case 'ping':
				this.sendSerialized({ msg: 'pong', id: data.id });
				break;
			case 'pong':
				break;

			// Streamer related messages

			case 'nosub':
				this.emit(`publication/${data.id}`, data);
				this.emit(`publication-no-sub/${data.id}`, data);
				break;
			case 'ready':
				data.subs.forEach((id) => {
					this.emit(`publication/${id}`, data);
				});
				break;
			case 'added':
			case 'changed':
			case 'removed':
				this.emit(data.id, data);
				break;

			// DDP/RCP related messages

			case 'result':
				this.emit(`result/${data.id}`, data);
				break;
			case 'updated':
				data.methods.forEach((id) => {
					this.emit(`result/${id}`, data);
				});
				break;
			default:
				throw new Error(`Unknown message type: ${data}`);
		}
	}

	sendSerialized(payload: MessagePayload) {
		this.send(this.encode(payload));
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
}

function wrapOnceEventIntoPromise<T extends { error?: string }>(emitter: Emitter, event: string) {
	return new Promise<T>((resolve, reject) => {
		emitter.once(event, (data: T) => {
			if ('error' in data) {
				return reject(data.error);
			}
			resolve(data);
		});
	});
}

export class Client {
	private readonly socket: WebSocket;

	private ws: DDPClient;

	constructor(readonly options: ClientOptions, readonly WebSocketConstructor: typeof WebSocket = WebSocket) {
		const socket = new WebSocketConstructor(options.url);

		this.socket = socket;

		this.ws = new ClassMinimalDDPClient(this.socket.send.bind(this.socket));

		socket.onmessage = (event) => {
			this.ws.handleMessage(event.data);
		};
	}

	private send(payload: MessagePayload) {
		this.ws.sendSerialized(payload);
	}

	call(method: string, ...params: any[]) {
		const id = this.ws.call(method, ...params);
		return wrapOnceEventIntoPromise(this.ws, `result/${id}`);
	}

	subscribe(name: string, ...params: any[]) {
		const id = this.ws.subscribe(name, ...params);

		return wrapOnceEventIntoPromise(this.ws, `publication/${id}`);
	}

	unsubscribe(id: string) {
		const payload: UnsubscribePayload = {
			msg: 'unsub',
			id,
		};
		this.send(payload);
		return wrapOnceEventIntoPromise(this.ws, `publication-no-sub/${id}`);
	}

	/* Procedure:
    * The server may send an initial message which is a JSON object lacking a msg key. If so, the client should ignore it. The client does not have to wait for this message. (The message was once used to help implement Meteor's hot code reload feature; it is now only included to force old clients to update).

    * The client sends a connect message.
    * If the server is willing to speak the version of the protocol specified in the connect message, it sends back a connected message.
    * Otherwise the server sends back a failed message with a version of DDP it would rather speak, informed by the connect message's support field, and closes the underlying transport.
    * The client is then free to attempt to connect again speaking a different version of DDP. It can do that by sending another connect message on a new connection. The client may optimistically send more messages after the connect message, assuming that the server will support the proposed protocol version. If the server does not support that version, it must ignore those additional messages.
    */

	connect() {
		const payload: ConnectPayload = {
			msg: 'connect',
			version: '1',
			support: SUPPORTED_DDP_VERSIONS,
		};
		this.send(payload);
	}

	async getNewClient(): Promise<Client> {
		const client = new Client(this.options, this.WebSocketConstructor);
		// The client sends a connect message.
		client.connect();

		return client;
	}
}
