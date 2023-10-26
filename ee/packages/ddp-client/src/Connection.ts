import { Emitter } from '@rocket.chat/emitter';

import type { DDPClient } from './types/DDPClient';

// type Subscription = {
// 	name: string;
// 	params: unknown[];
// 	id: string;
// 	status: 'queued' | 'subscribing' | 'ready' | 'error';
// };

// type Method = {
// 	method: string;
// 	params: unknown[];
// 	id: string;
// 	status: 'queued' | 'calling' | 'ready' | 'error';
// };

type RetryOptions = {
	retryCount: number;
	retryTimer?: NodeJS.Timeout;
	retryTime: number;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected' | 'reconnecting';

export interface Connection
	extends Emitter<{
		connection: ConnectionStatus;
		connecting: void;
		connected: string;
		disconnected: void;
		reconnecting: void;
		close: void;
	}> {
	url: string;
	ssl: boolean;

	session?: string;

	status: ConnectionStatus;

	connect(): Promise<boolean>;

	reconnect(): Promise<boolean>;

	close(): void;
}

interface WebSocketConstructor {
	new (url: string | URL, protocols?: string | string[]): WebSocket;
}

export class ConnectionImpl
	extends Emitter<{
		connection: ConnectionStatus;
		connecting: void;
		connected: string;
		disconnected: void;
		reconnecting: void;
		close: void;
	}>
	implements Connection
{
	ssl: boolean;

	url: string;

	session?: string;

	status: ConnectionStatus = 'idle';

	ws: WebSocket | undefined;

	retryCount = 0;

	public queue = new Set<string>();

	constructor(
		url: string,
		private WS: WebSocketConstructor,
		private client: DDPClient,
		readonly retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	) {
		super();
		this.ssl = url.startsWith('https') || url.startsWith('wss');
		this.url = url.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');

		this.client.onDispatchMessage((message: string) => {
			if (this.ws && this.ws.readyState === this.ws.OPEN) {
				this.ws.send(message);
				return;
			}

			this.queue.add(message);
		});

		this.on('connected', () => {
			this.queue.forEach((message) => {
				this.ws?.send(message);
			});

			this.queue.clear();
		});
	}

	private emitStatus() {
		this.emit('connection', this.status);
	}

	reconnect(): Promise<boolean> {
		if (this.status === 'connecting' || this.status === 'connected') {
			return Promise.reject(new Error('Connection in progress'));
		}

		clearTimeout(this.retryOptions.retryTimer);

		this.emit('reconnecting');

		this.emit('connection', 'reconnecting');

		return this.connect();
	}

	connect() {
		if (this.status === 'connecting' || this.status === 'connected') {
			return Promise.reject(new Error('Connection in progress'));
		}

		this.status = 'connecting';
		this.emit('connecting');
		this.emitStatus();

		const ws = new this.WS(`${this.ssl ? 'wss://' : 'ws://'}${this.url}/websocket`);

		this.ws = ws;

		return new Promise<boolean>((resolve, reject) => {
			ws.onopen = () => {
				ws.onmessage = (event) => {
					this.client.handleMessage(String(event.data));
				};

				// The server may send an initial message which is a JSON object lacking a msg key. If so, the client should ignore it. The client does not have to wait for this message.
				// (The message was once used to help implement Meteor's hot code reload feature; it is now only included to force old clients to update).
				// this.client.onceMessage((data) => {
				// 	if (data.msg === undefined) {
				// 		return;
				// 	}
				// 	if (data.msg === 'failed') {
				// 		return;
				// 	}
				// 	if (data.msg === 'connected') {
				// 		return;
				// 	}
				// 	this.close();
				// });

				// The client sends a connect message.

				this.client.connect();

				// If the server is willing to speak the version of the protocol specified in the connect message, it sends back a connected message.
				// Otherwise the server sends back a failed message with a version of DDP it would rather speak, informed by the connect message's support field, and closes the underlying transport.

				this.client.onConnection((payload) => {
					if (payload.msg === 'connected') {
						this.status = 'connected';
						this.emitStatus();
						this.emit('connected', payload.session);
						this.session = payload.session;
						return resolve(true);
					}
					if (payload.msg === 'failed') {
						this.status = 'failed';
						this.emitStatus();
						this.emit('disconnected');
						return reject(payload.version);
					}
					/* istanbul ignore next */
					reject(new Error('Unknown message type'));
				});
			};

			ws.onclose = () => {
				clearTimeout(this.retryOptions.retryTimer);
				if (this.status === 'closed') {
					return;
				}
				this.status = 'disconnected';
				this.emitStatus();
				this.emit('disconnected');

				if (this.retryCount >= this.retryOptions.retryCount) {
					return;
				}

				this.retryCount += 1;

				this.retryOptions.retryTimer = setTimeout(() => {
					this.reconnect();
				}, this.retryOptions.retryTime * this.retryCount);
			};
		});
	}

	close() {
		this.status = 'closed';
		this.ws?.close();
		this.emitStatus();
	}

	static create(
		url: string,
		webSocketImpl: WebSocketConstructor,
		client: DDPClient,
		retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	): ConnectionImpl {
		return new ConnectionImpl(url, webSocketImpl, client, retryOptions);
	}
}
