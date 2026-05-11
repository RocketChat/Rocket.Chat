import type { RestClientInterface } from '@rocket.chat/api-client';
import type { SDK, ClientStream, StreamKeys, StreamNames, StreamerCallbackArgs, ServerMethods } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { APIClient } from './RestApiClient';
import { parseDDP } from '../../../../client/lib/sdk/ddpProtocol';
import { ensureConnectedAndAuthenticated, getDdpSdk } from '../../../../client/lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../../../../client/lib/sdk/sdkTransportEnabled';

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

const sdkTransportEnabled = isSdkTransportEnabled();

const isChangedCollectionPayload = (
	msg: any,
): msg is { msg: 'changed'; collection: string; fields: { eventName: string; args: unknown[] } } => {
	if (typeof msg !== 'object' && (msg !== null || msg !== undefined)) {
		return false;
	}
	if (msg.msg !== 'changed') {
		return false;
	}
	if (typeof msg.collection !== 'string') {
		return false;
	}
	if (typeof msg.fields !== 'object' && (msg.fields !== null || msg.fields !== undefined)) {
		return false;
	}
	if (typeof msg.fields.eventName !== 'string') {
		return false;
	}
	if (!Array.isArray(msg.fields.args)) {
		return false;
	}
	return true;
};

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

const createNewMeteorStream = (streamName: StreamNames, key: StreamKeys<StreamNames>, args: unknown[]): StreamMapValue => {
	const ee = new Emitter<{
		ready: [error: any] | [undefined, any];
		error: [error: any];
		stop: undefined;
	}>();
	const meta = {
		ready: false,
	};

	const sub = Meteor.connection.subscribe(
		`stream-${streamName}`,
		key,
		{ useCollection: false, args },
		{
			onReady: (args: any) => {
				meta.ready = true;
				ee.emit('ready', [undefined, args]);
			},
			onError: (err: any) => {
				ee.emit('ready', [err]);
				ee.emit('error', err);
			},
			onStop: () => {
				ee.emit('stop');
			},
		},
	);

	const onChange: ReturnType<ClientStream['subscribe']>['onChange'] = (cb) => {
		if (meta.ready) {
			cb({
				msg: 'ready',

				subs: [],
			});
			return;
		}
		ee.once('ready', ([error, result]) => {
			if (error) {
				cb({
					msg: 'nosub',

					id: '',
					error,
				});
				return;
			}

			cb(result);
		});
	};

	const ready = () => {
		if (meta.ready) {
			return Promise.resolve();
		}
		return new Promise<void>((resolve, reject) => {
			ee.once('ready', ([err]) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	};

	return {
		stop: sub.stop,
		onChange,
		ready,
		onError: (cb: (...args: any[]) => void) =>
			ee.once('error', (error) => {
				cb(error);
			}),

		onStop: (cb: () => void) => ee.once('stop', cb),
		get isReady() {
			return meta.ready;
		},
		unsubList: new Set(),
	};
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

	// Defer the actual `subscribe` until DDPSDK is authenticated. Without this,
	// stream subscriptions fired immediately after re-login (e.g. the
	// SubscriptionsCachedStore's `notify-user/<uid>/subscriptions-changed`
	// listener that re-arms via onLoggedIn) hit the SDK socket while it's
	// still anonymous — server rejects with `not-allowed`/`nosub`, the
	// stream's `ready` promise emits an error, and the cached store never
	// receives subsequent server events. The visible failure: an agent that
	// just took a livechat chat post-relogin sees the chat work but the
	// "Move to the queue" button never appears, because the new subscription
	// the server creates for that agent is never replicated to the client's
	// Subscriptions store, and pseudoRoom (= {...sub, ...room}) ends up with
	// no `u` for the canMoveQueue check.
	let subscription: ReturnType<ReturnType<typeof getDdpSdk>['client']['subscribe']> | undefined;
	let offCollection: (() => void) | undefined;
	let stopped = false;

	void ensureConnectedAndAuthenticated()
		.catch(() => undefined)
		.then(() => {
			if (stopped) return;
			const sdk = getDdpSdk();
			subscription = sdk.client.subscribe(`stream-${streamName}`, key, { useCollection: false, args });

			subscription
				.ready()
				.then(() => {
					if (stopped) return;
					meta.ready = true;
					ee.emit('ready', [undefined, { msg: 'ready', subs: [subscription!.id] }]);
				})
				.catch((err) => {
					if (stopped) return;
					ee.emit('ready', [err]);
					ee.emit('error', err);
				});

			offCollection = sdk.client.onCollection(`stream-${streamName}`, (data: any) => {
				if (data?.msg !== 'changed') return;
				if (data.collection !== `stream-${streamName}`) return;
				if (data.fields?.eventName !== key) return;
				streamProxy.emit(`stream-${streamName}/${key}`, data.fields.args);
			});
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
			stopped = true;
			offCollection?.();
			subscription?.stop();
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

	const streams = new Map<string, StreamMapValue>();

	getDdpSdk().account.onLogout(() => {
		streams.forEach((stream) => {
			stream.unsubList.forEach((stop) => stop());
		});
	});

	if (!sdkTransportEnabled) {
		// In legacy Meteor mode, stream frames arrive on Meteor.connection._stream
		// as `changed` collection messages — bridge them into streamProxy so the
		// per-stream callbacks fire. With SDK transport on, the frames arrive on
		// the SDK socket and createNewDdpSdkStream registers its own onCollection
		// listener instead.
		Meteor.connection._stream!.on('message', (rawMsg: string) => {
			const msg = parseDDP(rawMsg);
			if (!isChangedCollectionPayload(msg)) {
				return;
			}
			streamProxy.emit(`${msg.collection}/${msg.fields.eventName}` as any, msg.fields.args as any);
		});
	}

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
			streams.get(eventLiteral) ||
			(sdkTransportEnabled
				? createNewDdpSdkStream(streamProxy, name, key as StreamKeys<StreamNames>, args)
				: createNewMeteorStream(name, key as StreamKeys<StreamNames>, args));

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

	const publish = sdkTransportEnabled
		? (name: string, args: unknown[]) => {
				// DDPSDK queues outbound frames until the WebSocket handshake completes,
				// so there's no need to gate on an isReady flag here.
				void getDdpSdk().client.callAsync(`stream-${name}`, ...args);
			}
		: (name: string, args: unknown[]) => {
				Meteor.call(`stream-${name}`, ...args);
			};

	const call = <T extends keyof ServerMethods>(method: T, ...args: Parameters<ServerMethods[T]>): Promise<ReturnType<ServerMethods[T]>> => {
		return Meteor.callAsync(method, ...args);
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
