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

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected';

export interface Connection
	extends Emitter<{
		connection: ConnectionStatus;
		disconnected: void;
		reconnecting: void;
		close: void;
	}> {
	session?: string;

	status: ConnectionStatus;

	connect(): Promise<boolean>;

	close(): void;
}

interface WebSocketConstructor {
	new (url: string | URL, protocols?: string | string[]): WebSocket;
}

export class ConnectionImpl
	extends Emitter<{
		connection: ConnectionStatus;
		disconnected: void;
		reconnecting: void;
		close: void;
	}>
	implements Connection
{
	session?: string;

	status: ConnectionStatus = 'idle';

	ws: WebSocket | undefined;

	retryCount = 0;

	constructor(
		readonly url: string,
		private WS: WebSocketConstructor,
		private client: DDPClient,
		readonly retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	) {
		super();
	}

	private emitStatus() {
		this.emit('connection', this.status);
	}

	connect() {
		this.status = 'connecting';
		this.emitStatus();

		const ws = new this.WS(this.url);

		let stop: () => void | undefined;
		return new Promise<boolean>((resolve, reject) => {
			ws.onopen = () => {
				ws.onmessage = (event) => {
					this.client.handleMessage(String(event.data));
				};

				const handle = (message: string) => {
					ws.send(message);
				};
				this.client.onDispatchMessage(handle);

				this.retryCount = 0;
				// The server may send an initial message which is a JSON object lacking a msg key. If so, the client should ignore it. The client does not have to wait for this message.
				// (The message was once used to help implement Meteor's hot code reload feature; it is now only included to force old clients to update).
				this.client.onceMessage((data) => {
					if (data.msg === undefined) {
						return;
					}
					if (data.msg === 'failed') {
						return;
					}
					if (data.msg === 'connected') {
						return;
					}
					this.close();
				});

				// The client sends a connect message.

				this.client.connect();

				// If the server is willing to speak the version of the protocol specified in the connect message, it sends back a connected message.
				// Otherwise the server sends back a failed message with a version of DDP it would rather speak, informed by the connect message's support field, and closes the underlying transport.

				this.client.onConnection((payload) => {
					if (payload.msg === 'connected') {
						this.status = 'connected';
						this.emitStatus();
						this.session = payload.session;
						return resolve(true);
					}
					if (payload.msg === 'failed') {
						this.status = 'failed';
						this.emitStatus();
						return reject(payload.version);
					}
					reject(new Error('Unknown message type'));
				});
			};

			ws.addEventListener('close', () => {
				clearTimeout(this.retryOptions.retryTimer);
				stop?.();
				if (this.status === 'closed') {
					return;
				}
				this.status = 'disconnected';
				this.emitStatus();

				if (this.retryCount >= this.retryOptions.retryCount) {
					return;
				}

				this.retryCount += 1;

				this.retryOptions.retryTimer = setTimeout(() => {
					this.emit('reconnecting');
					this.connect();
				}, this.retryOptions.retryTime);
			});
		});
	}

	close() {
		this.status = 'closed';
		this.ws?.close();
		this.emitStatus();
	}

	static create(
		url: string,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		WebSocketImpl: WebSocketConstructor,
		client: DDPClient,
		retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	): Connection {
		return new ConnectionImpl(url, WebSocketImpl, client, retryOptions);
	}
}
