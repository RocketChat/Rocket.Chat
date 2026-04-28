import type { RestClientInterface } from '@rocket.chat/api-client';
import type { SDK, ClientStream, StreamKeys, StreamNames, StreamerCallbackArgs, ServerMethods } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';

import { APIClient } from './RestApiClient';
import { ensureConnectedAndAuthenticated, getDdpSdk } from '../../../../client/lib/sdk/ddpSdk';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface SDK {
		stream<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			args: [key: K, ...args: unknown[]],
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
		call<T extends keyof ServerMethods>(method: T, ...args: Parameters<ServerMethods[T]>): Promise<ReturnType<ServerMethods[T]>>;
	}
}

type EventMap<N extends StreamNames = StreamNames, K extends StreamKeys<N> = StreamKeys<N>> = {
	[key in `stream-${N}/${K}`]: StreamerCallbackArgs<N, K>;
};

type StreamMapValue = {
	stop: () => void;
	onError: (cb: (...args: any[]) => void) => () => void;
	onChange: ReturnType<ClientStream['subscribe']>['onChange'];
	onStop: (cb: () => void) => () => void;
	ready: () => Promise<void>;
	isReady: boolean;
	unsubList: Set<() => void>;
};

const createNewDdpSdkStream = (
	streamProxy: Emitter<EventMap>,
	streamName: StreamNames,
	key: StreamKeys<StreamNames>,
	args: unknown[],
): StreamMapValue => {
	const ee = new Emitter<{
		ready: [error: any] | [undefined, any];
		error: [error: any];
		stop: undefined;
	}>();
	const meta = { ready: false };

	const sdk = getDdpSdk();
	const subscription = sdk.client.subscribe(`stream-${streamName}`, key, { useCollection: false, args });

	subscription
		.ready()
		.then(() => {
			meta.ready = true;
			ee.emit('ready', [undefined, { msg: 'ready', subs: [subscription.id] }]);
		})
		.catch((err) => {
			ee.emit('ready', [err]);
			ee.emit('error', err);
		});

	const offCollection = sdk.client.onCollection(`stream-${streamName}`, (data: any) => {
		if (data?.msg !== 'changed') return;
		if (data.collection !== `stream-${streamName}`) return;
		if (data.fields?.eventName !== key) return;
		streamProxy.emit(`stream-${streamName}/${key}` as keyof EventMap, data.fields.args);
	});

	const onChange: ReturnType<ClientStream['subscribe']>['onChange'] = (cb) => {
		if (meta.ready) {
			cb({ msg: 'ready', subs: [] });
			return;
		}
		ee.once('ready', ([error, result]) => {
			if (error) {
				cb({ msg: 'nosub', id: '', error });
				return;
			}
			cb(result);
		});
	};

	return {
		stop: () => {
			// Mirror Meteor's subscription semantics: explicit stop() does not fire the
			// 'stop' event (onStop is reserved for server-initiated closures).
			// Emitting it here would recurse through the onStop handler that
			// createStreamManager registers, which itself iterates the unsubList.
			offCollection();
			subscription.stop();
		},
		onChange,
		ready: () => {
			if (meta.ready) return Promise.resolve();
			return new Promise<void>((resolve, reject) => {
				ee.once('ready', ([err]) => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				});
			});
		},
		onError: (cb: (...args: any[]) => void) => ee.once('error', (error) => cb(error)),
		onStop: (cb: () => void) => ee.once('stop', cb),
		get isReady() {
			return meta.ready;
		},
		unsubList: new Set(),
	};
};

const createStreamManager = () => {
	// Emitter that replicates stream messages to registered callbacks
	const streamProxy = new Emitter<EventMap>();

	// Collection of unsubscribe callbacks for each stream.
	// const proxyUnsubLists = new Map<string, Set<() => void>>();

	const streams = new Map<string, StreamMapValue>();

	Accounts.onLogout(() => {
		streams.forEach((stream) => {
			stream.unsubList.forEach((stop) => stop());
		});
	});

	const stream: SDK['stream'] = <N extends StreamNames, K extends StreamKeys<N>>(
		name: N,
		data: [key: K, ...args: unknown[]],
		callback: (...args: StreamerCallbackArgs<N, K>) => void,
		_options?: {
			retransmit?: boolean | undefined;
			retransmitToSelf?: boolean | undefined;
		},
	): ReturnType<ClientStream['subscribe']> => {
		const [key, ...args] = data;
		const eventLiteral = `stream-${name}/${key}` as const;

		const proxyCallback = (args?: unknown): void => {
			if (!args || !Array.isArray(args)) {
				throw new Error('Invalid streamer callback');
			}
			callback(...(args as StreamerCallbackArgs<N, K>));
		};

		streamProxy.on(eventLiteral, proxyCallback);

		const stream =
			streams.get(eventLiteral) || createNewDdpSdkStream(streamProxy, name as StreamNames, key as StreamKeys<StreamNames>, args);

		const stop = (): void => {
			streamProxy.off(eventLiteral, proxyCallback);
			// If someone is still listening, don't unsubscribe
			if (streamProxy.has(eventLiteral)) {
				return;
			}

			if (stream) {
				stream.stop();
				streams.delete(eventLiteral);
			}
		};

		stream.unsubList.add(stop);
		if (!streams.has(eventLiteral)) {
			const offError = stream.onError(() => {
				stream.unsubList.forEach((stop) => stop());
			});

			const offStop = stream.onStop(() => {
				stream.unsubList.forEach((stop) => stop());
			});

			stream.unsubList.add(offError);
			stream.unsubList.add(offStop);
			streams.set(eventLiteral, stream);
		}

		return {
			id: '',
			name,
			params: data as any,
			stop,
			ready: stream.ready,
			onChange: stream.onChange,
			isReady: stream.isReady,
		};
	};

	const stopAll = (streamName: string, key: string) => {
		const stream = streams.get(`stream-${streamName}/${key}`);

		if (stream) {
			stream.unsubList.forEach((stop) => stop());
		}
	};

	return { stream, stopAll };
};

export const createSDK = (rest: RestClientInterface) => {
	const { stream, stopAll } = createStreamManager();

	const publish = (name: string, args: unknown[]) => {
		// DDPSDK queues outbound frames until the WebSocket handshake completes,
		// so there's no need to gate on an isReady flag here.
		void getDdpSdk().client.callAsync(`stream-${name}`, ...args);
	};

	const call = async <T extends keyof ServerMethods>(
		method: T,
		...args: Parameters<ServerMethods[T]>
	): Promise<ReturnType<ServerMethods[T]>> => {
		// Block on the SDK socket being connected and (if a stored token exists)
		// authenticated before dispatching. Without this, on a fresh re-login
		// (logout → login) the cached-store gets fire on the SDK socket BEFORE
		// sdk.account.loginWithToken lands. The server treats them as anonymous
		// and returns empty arrays; the cached stores persist the empty result
		// and the admin UI shows "No results found" until next reload.
		await ensureConnectedAndAuthenticated();
		return getDdpSdk().client.callAsync(method, ...args) as ReturnType<ServerMethods[T]>;
	};

	return {
		rest,
		stop: stopAll,
		stream,
		publish,
		call,
	};
};

export const sdk = createSDK(APIClient);
