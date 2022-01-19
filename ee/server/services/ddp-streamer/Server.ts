import { EventEmitter } from 'events';

import ejson from 'ejson';
import { v1 as uuidv1 } from 'uuid';

import { DDP_EVENTS } from './constants';
import { Publication } from './Publication';
import { Client } from './Client';
import { IPacket } from './types/IPacket';
import { MeteorService } from '../../../../server/sdk';

type SubscriptionFn = (this: Publication, eventName: string, options: object) => void;
type MethodFn = (this: Client, ...args: any[]) => any;
type Methods = {
	[k: string]: MethodFn;
};

// eslint-disable-next-line @typescript-eslint/camelcase
export const SERVER_ID = ejson.stringify({ server_id: '0' });

export class Server extends EventEmitter {
	private _subscriptions = new Map<string, SubscriptionFn>();

	private _methods = new Map<string, MethodFn>();

	public readonly id = uuidv1();

	serialize = ejson.stringify;

	parse = (packet: string): IPacket => {
		const payload = packet.startsWith('[') ? JSON.parse(packet)[0] : packet;
		return ejson.parse(payload);
	};

	async call(client: Client, packet: IPacket): Promise<void> {
		try {
			if (!this._methods.has(packet.method)) {
				const result = await MeteorService.callMethodWithToken(client.userId, client.userToken, packet.method, packet.params);
				if (result?.result) {
					return this.result(client, packet, result.result);
				}

				throw new Error(`Method '${packet.method}' doesn't exist`);
			}
			const fn = this._methods.get(packet.method);

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
			if (this._methods.has(name)) {
				return;
			}
			this._methods.set(name, fn);
		});
	}

	async subscribe(client: Client, packet: IPacket): Promise<void> {
		try {
			if (!this._subscriptions.has(packet.name)) {
				throw new Error(`Subscription '${packet.name}' doesn't exist`);
			}
			const fn = this._subscriptions.get(packet.name);
			if (!fn) {
				throw new Error('subscription not found');
			}

			const publication = new Publication(client, packet, this);
			const [eventName, options] = packet.params;
			await fn.call(publication, eventName, options);
		} catch (error) {
			this.nosub(client, packet, error.toString());
		}
	}

	publish(name: string, fn: SubscriptionFn): void {
		if (this._subscriptions.has(name)) {
			return;
		}
		this._subscriptions.set(name, fn);
	}

	stream(stream: string, fn: SubscriptionFn): void {
		return this.publish(`stream-${stream}`, fn);
	}

	result(client: Client, { id }: IPacket, result?: any, error?: string): void {
		client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.RESULT,
				id,
				...(result && { result }),
				...(error && { error }),
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
				...(error && { error }),
			}),
		);
	}

	ready(client: Client, packet: IPacket): void {
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.READY,
				[DDP_EVENTS.SUBSCRIPTIONS]: [packet.id],
			}),
		);
	}

	added(client: Client, collection: string, id: string, fields: any): void {
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.ADDED,
				[DDP_EVENTS.COLLECTION]: collection,
				[DDP_EVENTS.ID]: id,
				[DDP_EVENTS.FIELDS]: fields,
			}),
		);
	}

	changed(client: Client, collection: string, id: string, fields: any): void {
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.CHANGED,
				[DDP_EVENTS.COLLECTION]: collection,
				[DDP_EVENTS.ID]: id,
				[DDP_EVENTS.FIELDS]: fields,
			}),
		);
	}

	removed(client: Client, collection: string, id: string): void {
		return client.send(
			this.serialize({
				[DDP_EVENTS.MSG]: DDP_EVENTS.REMOVED,
				[DDP_EVENTS.COLLECTION]: collection,
				[DDP_EVENTS.ID]: id,
			}),
		);
	}
}
