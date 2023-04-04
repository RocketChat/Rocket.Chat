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
		close: void;
	}> {
	session?: string;

	status: ConnectionStatus;
}

export class ConnectionImpl
	extends Emitter<{
		connection: ConnectionStatus;
		disconnected: void;
		close: void;
	}>
	implements Connection
{
	session?: string;

	status: ConnectionStatus = 'idle';

	constructor(private ws: WebSocket, private client: DDPClient, _retryOptions?: RetryOptions) {
		super();
	}

	private emitStatus() {
		this.emit('connection', this.status);
	}

	connect() {
		this.status = 'connecting';
		this.emitStatus();
		return new Promise((resolve, reject) => {
			this.ws.onopen = () => {
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

			this.ws.addEventListener('close', () => {
				if (this.status === 'closed') {
					return;
				}
				if (this.status === 'failed') {
					return;
				}
				this.status = 'disconnected';
				this.emitStatus();
				// if (this.retryOptions.retryCount > 0) {
				// 	this.retryOptions.retryCount -= 1;
				// 	this.retryOptions.retryTimer = setTimeout(() => {
				// 		this.connect();
				// 	}, this.retryOptions.retryTime);
				// }
			});
		});
	}

	close() {
		this.status = 'closed';
		this.ws.close();
		this.emitStatus();
	}
}
