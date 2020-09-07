import WebSocket from 'ws';

import { Client } from './Client';
import { DDP_EVENTS, WS_ERRORS, WS_ERRORS_MESSAGES, TIMEOUT } from './constants';
import { SERVER_ID } from './Server';
import { server } from './configureServer';
import { IPacket } from './types/IPacket';

export class ClientMobile extends Client {
	constructor(
		public ws: WebSocket,
	) {
		super(ws);

		this.renewTimeout(TIMEOUT / 1000);
		this.ws.on('message', this.handler);
		this.ws.on('close', (...args) => {
			server.emit(DDP_EVENTS.DISCONNECTED, this);
			this.emit('close', ...args);
			this.subscriptions.clear();
			clearTimeout(this.timeout);
		});

		// Meteor thing
		this.ws.send('o');

		server.emit(DDP_EVENTS.CONNECTED, this);

		this.ws.on('message', () => this.renewTimeout(TIMEOUT));

		this.once('message', ({ msg }) => {
			if (msg !== DDP_EVENTS.CONNECT) {
				return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
			}
			return this.send(
				server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.CONNECTED, session: this.session }),
			);
		});

		this.send(SERVER_ID);
	}

	process(action: string, packet: IPacket): void {
		switch (action) {
			case DDP_EVENTS.PING:
				this.pong(packet.id);
				break;
			case DDP_EVENTS.METHOD:
				if (!packet.method) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				if (!packet.id) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				server.callMethod(this, packet);
				break;
			case DDP_EVENTS.SUSBCRIBE:
				if (!packet.name) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				if (!packet.id) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				server.callSubscribe(this, packet);
				break;
			case DDP_EVENTS.UNSUBSCRIBE:
				if (!packet.id) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				const subscription = this.subscriptions.get(packet.id);
				if (!subscription) {
					return;
				}
				subscription.stop();
				break;
		}
	}

	closeTimeout = (): void => {
		this.ws.close(WS_ERRORS.TIMEOUT, WS_ERRORS_MESSAGES.TIMEOUT);
	};

	ping(id?: string): void {
		this.send(server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PING, ...id && { [DDP_EVENTS.ID]: id } }));
	}

	pong(id?: string): void {
		this.send(server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PONG, ...id && { [DDP_EVENTS.ID]: id } }));
	}

	handleIdle = (): void => {
		this.ping();
		this.timeout = setTimeout(this.closeTimeout, TIMEOUT);
	};

	renewTimeout(timeout = TIMEOUT): void {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(this.handleIdle, timeout);
	}

	handler = async (payload: string): Promise<void> => {
		try {
			const packet = server.parse(payload);
			this.emit('message', packet);
			this.process(packet.msg, packet);
		} catch (err) {
			return this.ws.close(
				WS_ERRORS.UNSUPPORTED_DATA,
				WS_ERRORS_MESSAGES.UNSUPPORTED_DATA,
			);
		}
	};

	send(payload: string): void {
		// Meteor format
		return this.ws.send(`a${ JSON.stringify([payload]) }`);
	}
}
