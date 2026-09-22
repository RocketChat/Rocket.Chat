import { EventEmitter } from 'events';

import type { IPublication } from '@rocket.chat/streamer';

import type { Client } from './Client';
import type { IPacket } from './IPacket';
import { encodeAdded, encodeChanged, encodeNosub, encodeReady, encodeRemoved } from './codec';

export class Publication extends EventEmitter implements IPublication {
	_session: IPublication['_session'];

	connection: IPublication['connection'];

	constructor(
		public client: Client,
		private packet: IPacket,
	) {
		super();
		this.packet = packet;
		client.subscriptions.set(packet.id, this);
		client.once('close', () => this.emit('stop', this.client, this.packet));
		this.once('stop', () => client.subscriptions.delete(packet.id));

		this._session = {
			sendAdded: this.added.bind(this),
			socket: client,
			userId: client.userId,
		};

		this.connection = client.connection;
	}

	_isDeactivated(): this is IPublication & { _session: null } {
		return this._session === null;
	}

	error(_error: Error): void {
		// Unused here: publications signal failure by throwing.
	}

	unblock(): void {
		// Dispatch is already serialised per client, so there is no block to release.
	}

	ready(): void {
		return this.client.send(encodeReady(this.packet.id));
	}

	stop(): void {
		this.client.send(encodeNosub(this.packet.id));
		this.emit('stop', this.client, this.packet);
	}

	onStop(fn: (...args: any[]) => void): void {
		this.once('stop', fn);
	}

	added(collection: string, id: string, fields: any): void {
		this.client.send(encodeAdded(collection, id, fields));
	}

	changed(collection: string, id: string, fields: any): void {
		this.client.send(encodeChanged(collection, id, fields));
	}

	removed(collection: string, id: string): void {
		this.client.send(encodeRemoved(collection, id));
	}

	get userId() {
		return this.client.userId ?? null;
	}
}
