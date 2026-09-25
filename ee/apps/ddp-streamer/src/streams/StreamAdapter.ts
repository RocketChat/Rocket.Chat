import type { StreamNames } from '@rocket.chat/ddp-client';
import { Streamer } from '@rocket.chat/streamer';
import type { DDPSubscription, Connection, TransformMessage } from '@rocket.chat/streamer';
import WebSocket from 'ws';

import type { Server } from '../ddp/Server';
import type { Session } from '../ddp/Session';
import { encodeChanged, preframe } from '../ddp/codec';
import { isEmpty } from '../lib/utils';

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

			const frames = preframe(getMsg);

			for (const { subscription } of subscriptions) {
				// Every publication in this process is our Publication, so its client is our Session.
				const session = subscription.client as Session;

				if (session.ws.readyState !== WebSocket.OPEN) {
					subscription.stop();
					session.ws.close();
					continue;
				}

				if (this.retransmitToSelf === false && origin && origin === subscription.connection) {
					continue;
				}

				if (!(await this.isEmitAllowed(subscription, eventName, ...args))) {
					continue;
				}

				try {
					await session.sendFrames(frames);
				} catch (error: any) {
					if (error.code === 'ERR_STREAM_DESTROYED') {
						console.warn('Trying to send data to destroyed stream, closing connection.');

						if (session.ws.readyState !== WebSocket.OPEN) {
							subscription.stop();
							session.ws.close();
						}
					}
					console.error('Error trying to send data to stream.', error);
				}
			}
		}
	};
