import type { RestClientInterface } from '@rocket.chat/api-client';
import type { SDK, ClientStream, StreamKeys, StreamNames, StreamerCallbackArgs, ServerMethods } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';
import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

import { APIClient } from './RestApiClient';

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

	Meteor.connection._stream.on('message', (rawMsg: string) => {
		const msg = DDPCommon.parseDDP(rawMsg);
		if (!isChangedCollectionPayload(msg)) {
			return;
		}
		streamProxy.emit(`${msg.collection}/${msg.fields.eventName}` as any, msg.fields.args as any);
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

		const stream = streams.get(eventLiteral) || createNewMeteorStream(name, key, args);

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
		Meteor.call(`stream-${name}`, ...args);
	};

	const call = <T extends keyof ServerMethods>(method: T, ...args: Parameters<ServerMethods[T]>): Promise<ReturnType<ServerMethods[T]>> => {
		return Meteor.callAsync(method, ...args);
	};

	const disconnect = () => {
		Meteor.disconnect();
	};

	const reconnect = () => {
		Meteor.reconnect();
	};

	return {
		rest,
		stop: stopAll,
		stream,
		publish,
		call,
		disconnect,
		reconnect,
	};
};

export const sdk = createSDK(APIClient);
