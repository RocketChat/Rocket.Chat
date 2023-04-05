import { ClientStreamImpl } from './ClientStream';
import type { ClientStream } from './ClientStream';
import { Connection, ConnectionImpl } from './Connection';
import { MinimalDDPClient } from './MinimalDDPClient';
import { TimeoutControl } from './TimeoutControl';

/*
* The following procedure is used for streaming data:
* In the original Meteor DDP, Collections were used and publications and subscriptions were used to synchronize data between the client and server.
* However, controlling the `mergebox` can be expensive and doesn't scale well for many clients.
* To address this issue, we are using a specific part of the original implementation of the DDP protocol to send the data directly to the client without using the mergebox.
* This allows the client to receive more data directly from the server, even if the data is the same as before.

* To maintain compatibility with the original Meteor DDP, we use virtual collections.
* These collections are not real collections, but rather a way to send data to the client.
* They are named with the prefix stream- followed by the name of the stream.
* Instead of storing the data, they simply call the changed method.
* It's up to the application to handle the changed method and use the data it contains.

* In order for the server to function properly, it is important that it is aware of the 'agreement' and uses the same assumptions.
*/
interface SDK extends ClientStream {
	user?: {
		_id: string;
		username: string;
	};
	stream(name: string, params: unknown[], cb: (data: unknown) => void): Promise<() => void>;

	connection: Connection;
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
	public user?: {
		_id: string;
		username: string;
	};

	constructor(ddp: MinimalDDPClient, readonly connection: Connection) {
		super(ddp);
	}

	async stream(name: string, params: unknown[], cb: (data: PublicationPayloads) => void): Promise<() => void> {
		const cancel = await Promise.all([
			this.subscribe(name, ...params),
			this.onCollection(name, (data) => {
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

	static async create(url: string, retryOptions = { retryCount: 1, retryTime: 100 }): Promise<DDPSDK> {
		const ddp = new MinimalDDPClient();

		const connection = ConnectionImpl.create(url, WebSocket, ddp, retryOptions);

		TimeoutControl.create(ddp, connection);

		const sdk = new DDPSDK(ddp, connection);

		sdk.onCollection('users', (data) => {
			if (data.collection !== 'users') {
				return;
			}
			if (data.msg !== 'changed') {
				return;
			}

			if (!('fields' in data) || !('username' in data.fields!)) {
				return;
			}

			sdk.user = {
				...sdk.user,
				_id: data.id,
				username: data.fields.username,
			};
		});

		connection.on('connected', () => {
			Object.entries(sdk.subscriptions).forEach(([, sub]) => {
				ddp.subscribeWithId(sub.id, sub.name, ...sub.params);
			});
		});

		await connection.connect();
		return sdk;
	}
}
