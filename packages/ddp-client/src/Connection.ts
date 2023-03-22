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

	status: 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

	subscriptions: Subscription[];

	calls: Method[];
}

export class ConnectionImpl implements Connection {
	session?: string;

	status: 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' = 'idle';

	subscriptions: Subscription[] = [];

	calls: Method[] = [];

	constructor(private ws: WebSocket, private client: DDPMethods, private retryOptions: RetryOptions) {}

	connect() {
		return new Promise((resolve, reject) => {
			this.status = 'connecting';
			this.ws.addEventListener('open', () => {
				this.client.connect();
				this.client.onConnection((payload) => {
					if (payload.msg === 'connected') {
						this.status = 'connected';
						this.session = payload.session;
						return resolve(true);
					}
					if (payload.msg === 'failed') {
						this.status = 'failed';
						return reject(false);
					}
					this.status = 'failed';
					reject(new Error('Unknown message type'));
				});
			});

			this.ws.addEventListener('message', (event) => {
				this.client.handleMessage(event.data);
			});
		});
	}

	// static create(url: string, retryOptions: RetryOptions): ConnectionImpl {
	// 	const ws = new WebSocket(url);
	// 	const client = new ClassMinimalDDPClient(ws.send.bind(ws));
	// 	ws.onmessage = (event) => {
	// 		client.handleMessage(event.data);
	// 	};
	// 	return new ConnectionImpl(ws, client, retryOptions);
	// }
}
