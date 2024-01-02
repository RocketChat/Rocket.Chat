import type { RestClientInterface } from '@rocket.chat/api-client';
import type { SDK } from '@rocket.chat/ddp-client/src/DDPSDK';
import type { ClientStream } from '@rocket.chat/ddp-client/src/types/ClientStream';
import type { StreamKeys, StreamNames, StreamerCallbackArgs } from '@rocket.chat/ddp-client/src/types/streams';
import { Emitter } from '@rocket.chat/emitter';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

import { APIClient } from './RestApiClient';

declare module '@rocket.chat/ddp-client/src/DDPSDK' {
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

const createStreamManager = () => {
	// Emitter that replicates stream messages to registered callbacks
	const streamProxy = new Emitter<EventMap>();

	// Collection of unsubscribe callbacks for each stream.
	const proxyUnsubLists = new Map<string, Set<() => void>>();

	const streams = new Map<string, () => void>();

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

		const stop = (): void => {
			streamProxy.off(eventLiteral, proxyCallback);

			// If someone is still listening, don't unsubscribe
			if (streamProxy.has(eventLiteral)) {
				return;
			}

			const unsubscribe = streams.get(eventLiteral);
			if (unsubscribe) {
				unsubscribe();
				streams.delete(eventLiteral);
			}
		};

		const unsubList = proxyUnsubLists.get(eventLiteral) || new Set();
		unsubList.add(stop);
		if (!proxyUnsubLists.has(eventLiteral)) {
			proxyUnsubLists.set(eventLiteral, unsubList);
		}

		const meta = {
			ready: false,
		};

		if (!streams.has(eventLiteral)) {
			const sub = Meteor.connection.subscribe(
				`stream-${name}`,
				key,
				{ useCollection: false, args },
				{
					onReady: (args: any) => {
						meta.ready = true;
						ee.emit('ready', [undefined, args]);
					},
					onError: (err: any) => {
						console.error(err);
						ee.emit('ready', [err]);
					},
				},
			);
			streams.set(eventLiteral, sub.stop);
		}

		const ee = new Emitter();

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
			return new Promise<void>((r) => {
				ee.once('ready', r);
			});
		};

		return {
			id: '',
			name,
			params: data as any,
			stop,
			ready,
			onChange,
			get isReady() {
				return meta.ready;
			},
		};
	};

	const stopAll = (streamName: string, key: string) => {
		// We have to delete the stream first because waiting for the unsublist causes a race condition
		// when trying to create a new stream right after stopping the old one.
		const unsubList = proxyUnsubLists.get(`${streamName}/${key}`);
		// turning the set into an array to avoid stopping events registered on a new stream
		const unsubArray = unsubList ? Array.from(unsubList) : [];
		const streamLiteral = `stream-${streamName}/${key}`;
		const unsubscribe = streams.get(streamLiteral);
		if (unsubscribe) {
			unsubscribe();
			streams.delete(streamLiteral);
		}
		unsubArray.forEach((stop) => stop());
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

	return {
		rest,
		stop: stopAll,
		stream,
		publish,
		call,
	};
};

export const sdk = createSDK(APIClient);
