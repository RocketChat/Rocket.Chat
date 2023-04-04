import { EventEmitter } from 'events';

import type { IPublication } from 'meteor/rocketchat:streamer';

import type { Server } from './Server';
import type { Client } from './Client';
import type { IPacket } from './types/IPacket';

export class Publication extends EventEmitter implements IPublication {
	_session: IPublication['_session'];

	connection: IPublication['connection'];

	constructor(public client: Client, private packet: IPacket, private server: Server) {
		super();
		this.packet = packet;
		client.subscriptions.set(packet.id, this);
		client.once('close', () => this.emit('stop', this.client, this.packet));
		this.once('stop', () => client.subscriptions.delete(packet.id));

		this._session = {
			sendAdded: this.added,
			socket: client,
			userId: client.userId,
		};

		this.connection = client.connection;
	}

	error(_error: Error): void {
		throw new Error('Method not implemented.');
	}

	unblock(): void {
		throw new Error('Method not implemented.');
	}

	ready(): void {
		return this.server.ready(this.client, this.packet);
	}

	stop(): void {
		this.server.nosub(this.client, this.packet);
		this.emit('stop', this.client, this.packet);
	}

	onStop(fn: (...args: any[]) => void): void {
		this.once('stop', fn);
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

	get userId() {
		return this.client.userId ?? null;
	}
}
