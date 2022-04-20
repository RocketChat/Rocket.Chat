import WebSocket from 'ws';
import type { DDPSubscription, Connection, TransformMessage } from 'meteor/rocketchat:streamer';

import { server } from './configureServer';
import { DDP_EVENTS } from './constants';
import { isEmpty } from './lib/utils';
import { Streamer, StreamerCentral } from '../../../../apps/meteor/server/modules/streamer/streamer.module';
import { api } from '../../../../apps/meteor/server/sdk/api';

StreamerCentral.on('broadcast', (name, eventName, args) => {
	api.broadcast('stream', [name, eventName, args]);
});

export class Stream extends Streamer {
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
			if (this.retransmitToSelf === false && origin && origin === subscription.connection) {
				continue;
			}

			if (await this.isEmitAllowed(subscription, eventName, ...args)) {
				await new Promise<void>((resolve, reject) => {
					const frame = data[subscription.client.meteorClient ? 'meteor' : 'normal'];

					subscription.client.ws._sender.sendFrame(frame, (err: unknown) => {
						if (err) {
							return reject(err);
						}
						resolve();
					});
				});
			}
		}
	}
}
