import { EventEmitter } from 'events';

import { Logger } from '@rocket.chat/logger';
import type { IPublication } from '@rocket.chat/streamer';
import WebSocket from 'ws';

import type { IPacket } from './IPacket';
import type { Session } from './Session';
import { encodeAdded, encodeChanged, encodeNosub, encodeReady, encodeRemoved } from './codec';

const logger = new Logger('DDP-Streamer');

export class Publication extends EventEmitter implements IPublication {
	_session: IPublication['_session'];

	connection: IPublication['connection'];

	constructor(
		public client: Session,
		private packet: IPacket,
	) {
		super();
		this.packet = packet;
		client.subscriptions.set(packet.id, this);

		const onClientClose = () => this._deactivate();
		client.once('close', onClientClose);
		this.once('stop', () => {
			client.removeListener('close', onClientClose);
			client.subscriptions.delete(packet.id);
		});

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
		if (this._isDeactivated()) {
			return;
		}
		if (this.client.ws.readyState === WebSocket.OPEN) {
			this.client.send(encodeNosub(this.packet.id));
		}
		this._deactivate();
	}

	/** Ends the publication without notifying the client: it reports itself deactivated and its stop callbacks run, once. */
	_deactivate(): void {
		if (this._isDeactivated()) {
			return;
		}
		this._session = null;
		this.emit('stop', this.client, this.packet);
	}

	/**
	 * Runs `fn` when the publication stops, or right away when it already has, as Meteor's `Subscription.onStop` does.
	 * An error `fn` throws, or a rejection of the promise it returns, is logged, so it cannot keep the other stop callbacks, or the other publications of a closing session, from running.
	 */
	onStop(fn: (...args: any[]) => void | Promise<void>): void {
		const run = async (...args: any[]) => {
			try {
				await fn(...args);
			} catch (err) {
				logger.error({ msg: 'Publication stop callback failed', name: this.packet.name, err });
			}
		};
		if (this._isDeactivated()) {
			void run();
			return;
		}
		this.once('stop', (...args: any[]) => void run(...args));
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
