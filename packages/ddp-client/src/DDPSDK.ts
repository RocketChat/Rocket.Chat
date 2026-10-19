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
import type { Subscription } from './types/Subscription';
import type { ChangedPayload, PublicationPayloads } from './types/publicationPayloads';
import type { StreamKeys, StreamNames, StreamerCallbackArgs } from './types/streams';

type StreamEvent = ChangedPayload & { fields: { eventName: string; args: unknown[] } };

const isStreamEvent = (data: PublicationPayloads): data is StreamEvent =>
	data.msg === 'changed' && typeof data.fields?.eventName === 'string' && Array.isArray(data.fields.args);

type SharedStream = {
	name: string;
	key: unknown;
	subscription: Subscription;
	callbacks: Set<(...args: any[]) => void>;
};

export type DDPSDKOptions = {
	/** How many times in a row to try reconnecting after the connection drops. Defaults to `Infinity`. */
	retryCount?: number;
	/** Delay before the first reconnection attempt, in milliseconds; it doubles on each failed attempt up to 30 seconds, with jitter. Defaults to 1000. */
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

	stream<N extends StreamNames, K extends StreamKeys<N>>(
		streamName: N,
		data: K | [K, unknown],
		callback: (...args: StreamerCallbackArgs<N, K>) => void,
	): Subscription;

	stream(name: string, data: unknown, cb: (...args: any[]) => void): Subscription;

	// One server subscription per stream key, shared by every caller: the server sends each event once per subscription.
	stream(name: string, data: unknown, cb: (...args: any[]) => void): Subscription {
		const [key, args] = Array.isArray(data) ? data : [data];
		// The args authorise the subscription (Livechat sends the visitor token), so only identical ones share it.
		const id = JSON.stringify([name, key, args]);

		let shared = this.streams.get(id);
		// A subscription the server stopped can't be shared any more.
		if (!shared || !this.client.subscriptions.has(shared.subscription.id)) {
			shared = {
				name,
				key,
				subscription: this.client.subscribe(`stream-${name}`, key, { useCollection: false, args: [args] }),
				callbacks: new Set(),
			};
			this.streams.set(id, shared);
			this.listenToStream(name);
		}

		const { subscription, callbacks } = shared;
		const callback = (...eventArgs: unknown[]) => cb(...eventArgs);
		callbacks.add(callback);

		let stopped = false;
		const stopListenerRemovers = new Set<() => void>();
		return {
			id: subscription.id,
			name: subscription.name,
			params: subscription.params,
			get isReady() {
				return subscription.isReady;
			},
			get error() {
				return subscription.error;
			},
			ready: () => subscription.ready(),
			onChange: (fn) => subscription.onChange(fn),
			onStop: (listener) => {
				const remove = subscription.onStop(listener);
				stopListenerRemovers.add(remove);
				return remove;
			},
			stop: () => {
				if (stopped) return;
				stopped = true;
				stopListenerRemovers.forEach((remove) => remove());
				callbacks.delete(callback);
				if (callbacks.size > 0 || this.streams.get(id)?.subscription !== subscription) return;
				this.streams.delete(id);
				subscription.stop();
			},
		};
	}

	private streams = new Map<string, SharedStream>();

	// Kept for the SDK's lifetime: stream names are a small fixed set.
	private streamListeners = new Set<string>();

	private listenToStream(name: string) {
		if (this.streamListeners.has(name)) return;
		this.streamListeners.add(name);
		this.client.onCollection(`stream-${name}`, (data) => {
			if (!isStreamEvent(data)) return;
			// Frames don't say which subscription they answer: listeners of one key under different args get each other's frames.
			this.streams.forEach((shared) => {
				if (shared.name !== name || shared.key !== data.fields.eventName) return;
				shared.callbacks.forEach((callback) => callback(...data.fields.args));
			});
		});
	}

	protected static defaultOptions: Required<Pick<DDPSDKOptions, 'retryCount' | 'retryTime'>> = { retryCount: Infinity, retryTime: 1000 };

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
