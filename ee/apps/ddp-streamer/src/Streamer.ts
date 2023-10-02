import { api } from '@rocket.chat/core-services';
import type { StreamNames } from '@rocket.chat/ui-contexts';
import type { DDPSubscription, Connection, TransformMessage } from 'meteor/rocketchat:streamer';
import WebSocket from 'ws';

import { Streamer, StreamerCentral } from '../../../../apps/meteor/server/modules/streamer/streamer.module';
import { server } from './configureServer';
import { DDP_EVENTS } from './constants';
import { isEmpty } from './lib/utils';

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

	async sendToManySubscriptions(
		subscriptions: Set<DDPSubscription>,
		origin: Connection | undefined,
		eventName: string,
		args: any[],
		getMsg: string | TransformMessage,
	): Promise<void> {
		if (typeof getMsg === 'function') {
			return super.sendToManySubscriptions(subscriptions, origin, eventName, args, getMsg);
		}

		const options = {
			fin: true, // sending a single fragment message
			rsv1: false, // don"t set rsv1 bit (no compression)
			opcode: 1, // opcode for a text frame
			mask: false, // set false for client-side
			readOnly: false, // the data can be modified as needed
		};

		const data = {
			meteor: [Buffer.concat(WebSocket.Sender.frame(Buffer.from(`a${JSON.stringify([getMsg])}`), options))],
			normal: [Buffer.concat(WebSocket.Sender.frame(Buffer.from(getMsg), options))],
		};

		for await (const { subscription } of subscriptions) {
			// if the connection state is not open anymore, it somehow got to a weird state,
			// we'll emit close so it can clean up the weird state, and so we stop emitting to it
			if (subscription.client.ws.readyState !== WebSocket.OPEN) {
				subscription.stop();
				subscription.client.ws.close();
				continue;
			}

			if (this.retransmitToSelf === false && origin && origin === subscription.connection) {
				continue;
			}

			if (!(await this.isEmitAllowed(subscription, eventName, ...args))) {
				continue;
			}

			try {
				await new Promise<void>((resolve, reject) => {
					const frame = data[subscription.client.meteorClient ? 'meteor' : 'normal'];

					subscription.client.ws._sender.sendFrame(frame, (err: unknown) => {
						if (err) {
							return reject(err);
						}
						resolve();
					});
				});
			} catch (error: any) {
				if (error.code === 'ERR_STREAM_DESTROYED') {
					console.warn('Trying to send data to destroyed stream, closing connection.');

					// if we still tried to send data to a destroyed stream, we'll try again to close the connection
					if (subscription.client.ws.readyState !== WebSocket.OPEN) {
						subscription.stop();
						subscription.client.ws.close();
					}
				}
				console.error('Error trying to send data to stream.', error);
			}
		}
	}
}
