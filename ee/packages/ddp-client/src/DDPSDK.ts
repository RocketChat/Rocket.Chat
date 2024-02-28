import { RestClient } from '@rocket.chat/api-client';

import { ClientStreamImpl } from './ClientStream';
import type { Connection } from './Connection';
import { ConnectionImpl } from './Connection';
import { DDPDispatcher } from './DDPDispatcher';
import { TimeoutControl } from './TimeoutControl';
import type { Account } from './types/Account';
import { AccountImpl } from './types/Account';
import type { ClientStream } from './types/ClientStream';
import type { SDK } from './types/SDK';

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

	call(method: string, ...params: unknown[]) {
		return this.client.callAsync(method, ...params);
	}

	stream(name: string, data: unknown, cb: (...data: PublicationPayloads['fields']['args']) => void) {
		console.log('stream', name, data, cb);
		const [key, args] = Array.isArray(data) ? data : [data];
		const subscription = this.client.subscribe(`stream-${name}`, key, { useCollection: false, args: [args] });

		const stop = subscription.stop.bind(subscription);
		const cancel = [
			() => stop(),
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

		return Object.assign(subscription, {
			stop: () => {
				cancel.forEach((fn) => fn());
			},
		});
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
		console.log(url, retryOptions);
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
					'X-Auth-Token': account.user.token,
				};
			}
		})({ baseUrl: url });

		const sdk = new DDPSDK(connection, stream, account, timeoutControl, rest);
		console.log('stream', stream);
		console.log('account', account);
		console.log('timeoutControl', timeoutControl);
		console.log('rest', rest);
		console.log('sdk', sdk);
		console.log('connection', connection);

		connection.on('connected', () => {
			if (account.user?.token) {
				account.loginWithToken(account.user.token);
			}
			[...stream.subscriptions.entries()].forEach(([, sub]) => {
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
