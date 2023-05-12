import type { RestClientInterface } from '@rocket.chat/api-client';
import type { SDK } from '@rocket.chat/ddp-client/src/DDPSDK';
import { Emitter } from '@rocket.chat/emitter';
import type { StreamKeys, StreamNames, StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';
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
		): {
			stop: () => void;
			ready: () => Promise<void>;
			isReady: boolean;
			onReady: (cb: () => void) => void;
		};
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

export const createSDK = (rest: RestClientInterface) => {
	const ev = new Emitter();

	const streams = new Map<string, (...args: unknown[]) => void>();

	Meteor.connection._stream.on('message', (rawMsg: string) => {
		const msg = DDPCommon.parseDDP(rawMsg);
		if (!isChangedCollectionPayload(msg)) {
			return;
		}
		ev.emit(`${msg.collection}/${msg.fields.eventName}`, msg.fields.args);
	});

	const stream: SDK['stream'] = (
		name: string,
		data: [string, ...unknown[]],
		cb: (...args: unknown[]) => void,
	): { stop: () => void; ready: () => Promise<void>; isReady: boolean; onReady: (cb: () => void) => void } => {
		const [key, ...args] = data;
		const streamName = `stream-${name}`;
		const streamKey = `${streamName}/${key}`;

		const ee = new Emitter();

		const meta = {
			ready: false,
		};

		const onReady = (cb: () => void) => {
			if (meta.ready) {
				cb();
				return;
			}
			ee.once('ready', cb);
		};

		const ready = () => {
			if (meta.ready) {
				return Promise.resolve();
			}
			return new Promise<void>((r) => {
				ee.once('ready', r);
			});
		};

		const sub = Meteor.connection.subscribe(
			streamName,
			key,
			{ useCollection: false, args },
			{
				onReady: () => {
					meta.ready = true;
					ee.emit('ready');
				},
			},
		);

		const removeEv = ev.on(`${streamKey}`, (args) => cb(...args));

		const stop = () => {
			streams.delete(`${streamKey}`);
			sub.stop();
			removeEv();
		};

		streams.set(`${streamKey}`, stop);

		return {
			stop,
			ready,
			onReady,
			get isReady() {
				return meta.ready;
			},
		};
	};

	const stop = (name: string, key: string) => {
		const streamKey = `stream-${name}/${key}`;
		const stop = streams.get(streamKey);
		if (stop) {
			stop();
		}
	};

	const publish = (name: string, args: unknown[]) => {
		Meteor.call(`stream-${name}`, ...args);
	};

	return {
		rest,
		stop,
		stream,
		publish,
	};
};

export const sdk = createSDK(APIClient);
