import { api } from '@rocket.chat/core-services';
import type { StreamNames } from '@rocket.chat/ddp-client';
import { Logger } from '@rocket.chat/logger';
import WebSocket from 'ws';

import { server } from './configureServer';
import { DDP_EVENTS } from './constants';
import { buildTextFrame, sendRawFrame } from './lib/RawSender';
import { isEmpty } from './lib/utils';
import { Streamer, StreamerCentral } from '../../../../apps/meteor/server/modules/streamer/streamer.module';
import type { DDPSubscription, Connection, IPublication, TransformMessage } from '../../../../apps/meteor/server/modules/streamer/types';

const logger = new Logger('DDP-Streamer-FanOut');

StreamerCentral.on('broadcast', (name, eventName, args) => {
	void api.broadcast('stream', [name, eventName, args]);
});

export class Stream<N extends StreamNames> extends Streamer<N> {
	registerPublication(name: string, fn: (eventName: string, options: boolean | { useCollection?: boolean; args?: any }) => void): void {
		server.publish(name, fn);
	}

	registerMethod(methods: Record<string, (eventName: string, ...args: any[]) => any>): void {
		server.methods(methods);
	}

	changedPayload(collection: string, id: string, fields: Record<string, any>): string | false {
		return (
			!isEmpty(fields) &&
			server.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.CHANGED,
				[DDP_EVENTS.COLLECTION]: collection,
				[DDP_EVENTS.ID]: id,
				[DDP_EVENTS.FIELDS]: fields,
			})
		);
	}

	override async sendToManySubscriptions(
		subscriptions: Set<DDPSubscription>,
		origin: Connection | undefined,
		eventName: string,
		args: any[],
		getMsg: string | TransformMessage,
	): Promise<void> {
		if (typeof getMsg === 'function') {
			return super.sendToManySubscriptions(subscriptions, origin, eventName, args, getMsg);
		}

		await fanOutText(subscriptions, getMsg, {
			eventName,
			streamName: this.name,
			retransmitToSelf: this.retransmitToSelf,
			origin,
			isEmitAllowed: (publication) => this.isEmitAllowed(publication, eventName, ...args),
		});
	}
}

export type FanOutOptions = {
	eventName: string;
	streamName: string;
	retransmitToSelf: boolean;
	origin: Connection | undefined;
	isEmitAllowed: (publication: IPublication) => Promise<boolean | object>;
};

/**
 * Walk a subscription set once, decide per-subscription whether to forward the message, and
 * write the pre-built frame straight into each socket. Extracted from
 * `Stream.sendToManySubscriptions` so the loop is testable in isolation: the only
 * dependencies are `RawSender.send` (mockable via the ws state) and the caller-provided
 * `isEmitAllowed` predicate.
 */
export async function fanOutText(subscriptions: Set<DDPSubscription>, payload: string, opts: FanOutOptions): Promise<void> {
	// Build each frame variant once for the entire fan-out — every subscriber re-uses the
	// same encoded buffer.
	const frames = {
		meteor: buildTextFrame(`a${JSON.stringify([payload])}`),
		normal: buildTextFrame(payload),
	};

	for (const { subscription } of subscriptions) {
		if (subscription.client.ws.readyState !== WebSocket.OPEN) {
			subscription.stop();
			subscription.client.ws.close();
			continue;
		}

		if (opts.retransmitToSelf === false && opts.origin && opts.origin === subscription.connection) {
			continue;
		}

		if (!(await opts.isEmitAllowed(subscription))) {
			continue;
		}

		const frame = frames[subscription.client.meteorClient ? 'meteor' : 'normal'];
		const outcome = await sendRawFrame(subscription.client.ws, frame);

		if (outcome === 'sent') {
			continue;
		}

		if (outcome === 'closed' || outcome === 'slow-consumer') {
			subscription.stop();
			if (outcome === 'closed' && subscription.client.ws.readyState !== WebSocket.OPEN) {
				subscription.client.ws.close();
			}
			continue;
		}

		logger.error({ msg: 'Error trying to send data to stream', stream: opts.streamName, eventName: opts.eventName });
	}
}
