import { RestClient } from '@rocket.chat/api-client';

import { ClientStreamImpl } from './ClientStream';
import type { ClientStream } from './ClientStream';
import type { Connection } from './Connection';
import { ConnectionImpl } from './Connection';
import { DDPDispatcher } from './DDPDispatcher';
import { TimeoutControl } from './TimeoutControl';
import type { Account } from './types/Account';
import { AccountImpl } from './types/Account';

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
export interface SDK {
	stream(
		name: string,
		params: unknown[],
		cb: (...data: unknown[]) => void,
	): {
		stop: () => void;
		ready: () => Promise<void>;
		isReady: boolean;
		onReady: (cb: () => void) => void;
	};

	connection: Connection;
	account: Account;
	client: ClientStream;

	timeoutControl: TimeoutControl;
	rest: RestClient;
}

interface PublicationPayloads {
	collection: string;
	id: string;
	msg: 'added' | 'changed' | 'removed';
	fields: {
		eventName: string;
		args: [unknown];
	};
}

const isValidPayload = (data: unknown): data is PublicationPayloads => {
	if (typeof data !== 'object' && (data !== null || data !== undefined)) {
		return false;
	}
	return true;
};

export class DDPSDK implements SDK {
	constructor(
		readonly connection: Connection,
		readonly client: ClientStream,
		readonly account: Account,
		readonly timeoutControl: TimeoutControl,
		readonly rest: RestClient,
	) {}

	stream(name: string, key: unknown, cb: (...data: PublicationPayloads['fields']['args']) => void) {
		const { id } = this.client.subscribe(`stream-${name}`, key);

		const cancel = [
			() => this.client.unsubscribe(id),
			this.client.onCollection(`stream-${name}`, (data) => {
				if (!isValidPayload(data)) {
					return;
				}

				if (data.collection !== `stream-${name}`) {
					return;
				}
				if (data.msg !== 'changed') {
					return;
				}
				if (data.fields.eventName === key) {
					cb(...data.fields.args);
				}
			}),
		];

		return {
			stop: () => {
				cancel.forEach((fn) => fn());
			},
			ready: async () => undefined,
			isReady: false,
			onReady: (_cb: () => void) => void 0,
		};
	}

	/**
	 * Compounds the Objects responsible for the SDK and returns it through
	 * SDK interface
	 *
	 * @param url - The URL of the server to connect to
	 * @param retryOptions - The options for the retry strategy of the connection
	 * @param retryOptions.retryCount - The number of times to retry the connection
	 * @param retryOptions.retryTime - The time to wait between retries
	 * @returns The SDK interface
	 *
	 * @example
	 * ```ts
	 * const sdk = DDPSDK.create('wss://open.rocket.chat/websocket');
	 * sdk.connection.connect();
	 * ```
	 */
	static create(url: string, retryOptions = { retryCount: 1, retryTime: 100 }): DDPSDK {
		const ddp = new DDPDispatcher();

		const connection = ConnectionImpl.create(url, WebSocket, ddp, retryOptions);

		const stream = new ClientStreamImpl(ddp, ddp);

		const account = new AccountImpl(stream);

		const timeoutControl = TimeoutControl.create(ddp, connection);

		const rest = new (class RestApiClient extends RestClient {
			getCredentials() {
				if (!account.uid || !account.user?.token) {
					return;
				}
				return {
					'X-User-Id': account.uid,
					'X-Auth-Token': account.user?.token,
				};
			}
		})({ baseUrl: url });

		const sdk = new DDPSDK(connection, stream, account, timeoutControl, rest);

		connection.on('connected', () => {
			Object.entries(stream.subscriptions).forEach(([, sub]) => {
				ddp.subscribeWithId(sub.id, sub.name, sub.params);
			});
		});

		return sdk;
	}

	/**
	 * Same as `DDPSDK.create`, but also connects to the server and waits for the connection to be established
	 * @param url - The URL of the server to connect to
	 * @param retryOptions - The options for the retry strategy of the connection
	 * @param retryOptions.retryCount - The number of times to retry the connection
	 * @param retryOptions.retryTime - The time to wait between retries
	 * @returns A promise that resolves to the SDK interface
	 * @example
	 * ```ts
	 * const sdk = await DDPSDK.createAndConnect('wss://open.rocket.chat/websocket');
	 * ```
	 */

	static async createAndConnect(url: string, retryOptions = { retryCount: 1, retryTime: 100 }): Promise<DDPSDK> {
		const sdk = DDPSDK.create(url, retryOptions);

		await sdk.connection.connect();

		return sdk;
	}
}
