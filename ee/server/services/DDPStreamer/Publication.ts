import { EventEmitter } from 'events';

import { DDP_EVENTS } from './constants';
import { Server } from './Server';
import { server } from './configureServer';
import { sendBroadcast } from './lib/sendBroadcast';
import { Client } from './Client';
import { IPacket } from './types/IPacket';
import { ISubscription } from '../../../../definition/ISubscription';

export class Publication extends EventEmitter {
	constructor(
		public client: Client,
		private packet: IPacket,
		private server: Server,
	) {
		super();
		this.packet = packet;
		client.subscriptions.set(packet.id, this);
		client.once('close', () => this.emit('stop', this.client, this.packet));
		this.once('stop', () => client.subscriptions.delete(packet.id));
	}

	ready(): void {
		return this.server.ready(this.client, this.packet);
	}

	stop(): void {
		this.server.nosub(this.client, this.packet);
		this.emit('stop', this.client, this.packet);
	}

	added(collection: string, id: string, fields: any): void {
		this.server.added(this.client, collection, id, fields);
	}

	changed(collection: string, id: string, fields: any): void {
		this.server.changed(this.client, collection, id, fields);
	}

	removed(collection: string, id: string): void {
		this.server.removed(this.client, collection, id);
	}

	get userId(): string {
		return this.client.userId;
	}
}

export const changedPayload = (collection: string, id: string, fields: object, cleared: string[]): string =>
	server.serialize({
		[DDP_EVENTS.MSG]: DDP_EVENTS.CHANGED,
		[DDP_EVENTS.COLLECTION]: collection,
		[DDP_EVENTS.ID]: id,
		[DDP_EVENTS.FIELDS]: fields,
		[DDP_EVENTS.CLEARED]: cleared,
	});


export class Publish {
	subscriptionsByEventName = new Map();

	constructor(private name: string) {
		//
	}

	addSubscription(subscription: ISubscription, eventName: string): void {
		// this.subscriptions.add(subscription);
		if (!this.subscriptionsByEventName.has(eventName)) {
			this.subscriptionsByEventName.set(
				eventName,
				new Set([subscription]),
			);
			return;
		}

		this.subscriptionsByEventName
			.get(eventName)
			.add(subscription);
	}

	removeSubscription(subscription: ISubscription, eventName: string): void {
		// this.subscriptions.delete(subscription);
		const subscriptions = this.subscriptionsByEventName.get(
			eventName,
		);
		if (subscriptions) {
			subscriptions.delete(subscription);
			if (!subscriptions.size) {
				this.subscriptionsByEventName.delete(eventName);
			}
		}
	}

	emit(eventName: string, id: string, fields: object, cleared: string[]): void {
		const subscriptions = this.subscriptionsByEventName.get(eventName);
		if (!subscriptions || !subscriptions.size) {
			return;
		}

		const msg = changedPayload(this.name, id, fields, cleared);

		if (!msg) {
			return;
		}

		sendBroadcast(subscriptions, msg);
	}
}
