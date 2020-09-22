import { EventEmitter } from 'events';

import ejson from 'ejson';

import { DDP_EVENTS } from './constants';
import { Publication } from './Publication';
import { Client } from './Client';
import { IPacket } from './types/IPacket';

type SubscriptionFn = (publication: Publication, client: Client, eventName: string, options: object) => void;
type MethodFn = (this: Client, ...args: any[]) => any;
type Methods = {
	[k: string]: MethodFn;
}

// eslint-disable-next-line @typescript-eslint/camelcase
export const SERVER_ID = ejson.stringify({ server_id: '0' });

const methods = Symbol('methods');
const subscriptions = Symbol('subscriptions');

// TODO: remove, web-client still receives the object of the logged in user, verify if that works
// export const User = new Publish('user');

export class Server extends EventEmitter {
	[subscriptions] = new Map<string, SubscriptionFn>();

	[methods] = new Map<string, MethodFn>();

	serialize = ejson.stringify;

	parse = (packet: string): IPacket => {
		const [payload] = JSON.parse(packet);
		return ejson.parse(payload);
	}

	async callMethod(client: Client, packet: IPacket): Promise<void> {
		try {
			if (!this[methods].has(packet.method)) {
				throw new Error(`Method '${ packet.method }' doesn't exist`);
			}
			const fn = this[methods].get(packet.method);

			if (!fn) {
				throw Error('method not found');
			}

			const result = await fn.apply(client, packet.params);
			return this.result(client, packet, result);
		} catch (error) {
			return this.result(client, packet, null, error.toString());
		}
	}

	methods(obj: Methods): void {
		Object.entries(obj).forEach(([name, fn]) => {
			if (this[methods].has(name)) {
				return;
			}
			this[methods].set(name, fn);
		});
	}

	async callSubscribe(client: Client, packet: IPacket): Promise<void> {
		try {
			if (!this[subscriptions].has(packet.name)) {
				throw new Error(`Subscription '${ packet.name }' doesn't exist`);
			}
			const fn = this[subscriptions].get(packet.name);
			if (!fn) {
				throw new Error('subscription not found');
			}

			const publication = new Publication(client, packet, this);
			const [eventName, ...options] = packet.params;
			await fn(publication, client, eventName, options);
		} catch (error) {
			this.nosub(client, packet, error.toString());
		}
	}

	subscribe(name: string, fn: SubscriptionFn): void {
		if (this[subscriptions].has(name)) {
			return;
		}
		this[subscriptions].set(name, fn);
	}

	stream(stream: string, fn: SubscriptionFn): void {
		return this.subscribe(`stream-${ stream }`, fn);
	}

	result(client: Client, { id }: IPacket, result?: any, error?: string): void {
		client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.RESULT,
				id,
				...result && { result },
				...error && { error },
			}),
		);
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.UPDATED,
				[DDP_EVENTS.METHODS]: [id],
			}),
		);
	}

	nosub(client: Client, { id }: IPacket, error?: string): void {
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.NO_SUBSCRIBE,
				id,
				...error && { error },
			}),
		);
	}

	ready(client: Client, packet: IPacket): void {
		return client.send(
			this.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.READY, [DDP_EVENTS.SUBSCRIPTIONS]: [packet.id] }),
		);
	}
}
