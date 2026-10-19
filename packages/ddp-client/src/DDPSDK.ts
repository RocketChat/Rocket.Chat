import { RestClient } from '@rocket.chat/api-client';

import { ClientStreamImpl, ConnectionLostError } from './ClientStream';
import type { Connection, WebSocketConstructor } from './Connection';
import { ConnectionImpl } from './Connection';
import { DDPDispatcher } from './DDPDispatcher';
import { TimeoutControl } from './TimeoutControl';
import type { Account } from './types/Account';
import { AccountImpl } from './types/Account';
import type { ClientStream } from './types/ClientStream';
import type { OutgoingPayload } from './types/OutgoingPayload';
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

export type DDPSDKOptions = {
	/** How many times to reconnect after the connection drops. */
	retryCount?: number;
	/** Base delay before a reconnection, in milliseconds. */
	retryTime?: number;
	/** Serialises outgoing DDP frames; pass `EJSON.stringify` to send EJSON types. Defaults to `JSON.stringify`. */
	encode?: (payload: OutgoingPayload) => string;
	/** Parses incoming DDP frames; pass `EJSON.parse` to receive EJSON types. Defaults to `JSON.parse`. */
	decode?: (raw: string) => unknown;
	/** Defaults to the global `WebSocket`. */
	WebSocket?: WebSocketConstructor;
};

/** The REST base URL for a server URL given with an http(s) or ws(s) scheme. */
export const toRestUrl = (url: string): string =>
	url
		.replace(/^ws/, 'http')
		.replace(/\/websocket\/?$/, '')
		.replace(/\/$/, '');

/** Fails the method calls that went out on a connection once it drops or is closed. */
export const rejectInFlightOnConnectionLoss = (connection: Connection, stream: ClientStreamImpl): void => {
	let connected = false;
	connection.on('connected', () => {
		connected = true;
	});
	const onLoss = () => {
		if (!connected) return;
		connected = false;
		stream.rejectInFlight();
	};
	connection.on('disconnected', onLoss);
	connection.on('close', onLoss);
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

	protected static defaultOptions: Required<Pick<DDPSDKOptions, 'retryCount' | 'retryTime'>> = { retryCount: 1, retryTime: 100 };

	/**
	 * Compounds the Objects responsible for the SDK and returns it through
	 * SDK interface
	 *
	 * @param url - The URL of the server to connect to
	 * @param options - Retry strategy, wire codec and WebSocket implementation; see `DDPSDKOptions`
	 * @returns The SDK interface
	 *
	 * @example
	 * ```ts
	 * const sdk = DDPSDK.create('https://open.rocket.chat');
	 * sdk.connection.connect();
	 * ```
	 */
	static create<T extends typeof DDPSDK>(this: T, url: string, options: DDPSDKOptions = {}): InstanceType<T> {
		const {
			retryCount,
			retryTime,
			encode,
			decode,
			WebSocket: WebSocketImpl = globalThis.WebSocket,
		} = { ...this.defaultOptions, ...options };

		const ddp = new DDPDispatcher(undefined, encode, decode);

		const connection = ConnectionImpl.create(url, WebSocketImpl, ddp, { retryCount, retryTime });

		const stream = new ClientStreamImpl(ddp, ddp);

		const account = new AccountImpl(stream);

		const timeoutControl = TimeoutControl.create(ddp, connection);

		const rest = new (class RestApiClient extends RestClient {
			override getCredentials() {
				if (!account.uid || !account.user?.token) {
					return;
				}
				return {
					'X-User-Id': account.uid,
					'X-Auth-Token': account.user.token,
				};
			}
		})({ baseUrl: toRestUrl(url) });

		const sdk = new this(connection, stream, account, timeoutControl, rest) as InstanceType<T>;

		rejectInFlightOnConnectionLoss(connection, stream);

		connection.on('connected', async () => {
			const token = account.user?.token;
			if (token) {
				try {
					await account.loginWithToken(token);
				} catch (error) {
					// The next connection retries with the same token.
					if (error instanceof ConnectionLostError) return;
					account.user = undefined;
					account.uid = undefined;
				}
			}
			// Restored only after the re-login so subscriptions that need a user aren't refused.
			[...stream.subscriptions.entries()].forEach(([, sub]) => {
				ddp.subscribeWithId(sub.id, sub.name, sub.params);
			});
		});

		return sdk;
	}

	/**
	 * Same as `DDPSDK.create`, but also connects to the server and waits for the connection to be established
	 * @param url - The URL of the server to connect to
	 * @param options - Same as `DDPSDK.create`
	 * @returns A promise that resolves to the SDK interface
	 * @example
	 * ```ts
	 * const sdk = await DDPSDK.createAndConnect('https://open.rocket.chat');
	 * ```
	 */
	static async createAndConnect<T extends typeof DDPSDK>(this: T, url: string, options: DDPSDKOptions = {}): Promise<InstanceType<T>> {
		const sdk = this.create(url, options);

		await sdk.connection.connect();

		return sdk;
	}
}
