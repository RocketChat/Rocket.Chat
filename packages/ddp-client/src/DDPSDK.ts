import { ClientStreamImpl } from './ClientStream';
import type { ClientStream } from './ClientStream';
import { ConnectionImpl } from './Connection';
import { MinimalDDPClient } from './MinimalDDPClient';
import { TimeoutControl } from './TimeoutControl';

interface SDK extends ClientStream {
	stream(name: string, params: unknown[], cb: (data: unknown) => void): Promise<() => void>;
}

interface PublicationPayloads {
	collection: string;
	id: string;
	msg: 'added' | 'changed' | 'removed';
	fields: {
		eventName: string;
		args: ['added' | 'changed' | 'removed', unknown];
	};
}

const isValidPayload = (data: unknown): data is PublicationPayloads => {
	if (typeof data !== 'object' && (data !== null || data !== undefined)) {
		return false;
	}
	return true;
};

export class DDPSDK extends ClientStreamImpl implements SDK {
	async stream(name: string, params: unknown[], cb: (data: PublicationPayloads) => void): Promise<() => void> {
		const cancel = await Promise.all([
			this.subscribe(name, ...params),
			this.onCollection(name, (data) => {
				console.log('onCollection->', data, params[0]);
				if (!isValidPayload(data)) {
					return;
				}

				if (data.collection !== name) {
					return;
				}
				if (data.msg !== 'changed') {
					return;
				}
				if (data.fields.eventName === params[0]) {
					cb(data);
				}
			}),
		]);
		return () => {
			cancel.forEach((fn) => fn());
		};
	}

	static async create(url: string): Promise<DDPSDK> {
		const websocket = new WebSocket(url);

		const ddp = new MinimalDDPClient((data) => {
			websocket.send(data);
		});

		const connection = new ConnectionImpl(websocket as any, ddp);

		const timeout = TimeoutControl.create(ddp, connection);

		websocket.onmessage = (event) => {
			timeout.reset();
			ddp.handleMessage(String(event.data));
		};

		await connection.connect();

		return new DDPSDK(ddp);
	}
}
