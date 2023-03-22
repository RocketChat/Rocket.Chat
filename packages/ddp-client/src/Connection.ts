import type { DDPMethods } from './ClassMinimalDDPClient';

type Subscription = {
	name: string;
	params: unknown[];
	id: string;
	status: 'queued' | 'subscribing' | 'ready' | 'error';
};

type Method = {
	method: string;
	params: unknown[];
	id: string;
	status: 'queued' | 'calling' | 'ready' | 'error';
};

type RetryOptions = {
	retryCount: number;
	retryTimer?: NodeJS.Timeout;
	retryTime: number;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Connection {
	session?: string;

	status: 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected';

	subscriptions: Subscription[];

	calls: Method[];
}

export class ConnectionImpl implements Connection {
	session?: string;

	status: 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected' = 'idle';

	subscriptions: Subscription[] = [];

	calls: Method[] = [];

	constructor(private ws: WebSocket, private client: DDPMethods, private retryOptions: RetryOptions) {}

	connect() {
		this.status = 'connecting';
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
						this.session = payload.session;
						return resolve(true);
					}
					if (payload.msg === 'failed') {
						this.status = 'failed';
						return reject(payload.version);
					}
					reject(new Error('Unknown message type'));
				});
			};

			this.ws.addEventListener('message', (event) => {
				this.client.handleMessage(event.data);
			});

			this.ws.addEventListener('close', () => {
				if (this.status === 'closed') {
					return;
				}
				if (this.status === 'failed') {
					return;
				}
				this.status = 'disconnected';
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
	}
}
