import type { StreamNames } from '@rocket.chat/ddp-client';
import { Streamer } from '@rocket.chat/streamer';
import type { DDPSubscription, Connection, TransformMessage } from '@rocket.chat/streamer';
import WebSocket from 'ws';

import type { Server } from './Server';
import { encodeChanged, preframe } from './codec';
import { isEmpty } from './lib/utils';

export const createStreamAdapter = (server: Server) =>
	class Stream<N extends StreamNames> extends Streamer<N> {
		registerPublication(name: string, fn: (eventName: string, options: boolean | { useCollection?: boolean; args?: any }) => void): void {
			server.publish(name, fn);
		}

		registerMethod(methods: Record<string, (eventName: string, ...args: any[]) => any>): void {
			server.methods(methods);
		}

		changedPayload(collection: string, id: string, fields: Record<string, any>): string | false {
			return !isEmpty(fields) && encodeChanged(collection, id, fields);
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

			const data = preframe(getMsg);

			for (const { subscription } of subscriptions) {
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

						if (subscription.client.ws.readyState !== WebSocket.OPEN) {
							subscription.stop();
							subscription.client.ws.close();
						}
					}
					console.error('Error trying to send data to stream.', error);
				}
			}
		}
	};
