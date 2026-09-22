import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import { Presence } from '@rocket.chat/core-services';
import type { ISocketConnection } from '@rocket.chat/core-typings';
import { throttle } from 'underscore';
import { v1 as uuidv1 } from 'uuid';
import type WebSocket from 'ws';

import type { Server } from './Server';
import { SERVER_ID } from './Server';
import { DDP_EVENTS, WS_ERRORS, WS_ERRORS_MESSAGES, TIMEOUT } from './constants';
import { getClientAddress } from './lib/clientAddress';
import type { ConnectionLifecycle } from './lifecycle';
import type { IPacket } from './types/IPacket';

export class Client extends EventEmitter {
	private chain = Promise.resolve();

	protected timeout: NodeJS.Timeout;

	public readonly session = uuidv1();

	public subscriptions = new Map();

	public connection: ISocketConnection;

	public userId?: string;

	public userToken?: string;

	private updatePresence = throttle(
		() => {
			if (this.userId) {
				void Presence.updateConnection(this.userId, this.connection.id).catch((err) => {
					console.error('Error updating connection presence:', err);
				});
			}
		},
		TIMEOUT,
		{ leading: true, trailing: false },
	);

	constructor(
		private readonly server: Server,
		private readonly lifecycle: ConnectionLifecycle,
		public ws: WebSocket,
		public meteorClient: boolean,
		req: IncomingMessage,
	) {
		super();

		this.connection = {
			id: this.session,
			instanceId: server.id,
			onClose: (fn): void => {
				this.on('close', fn);
			},
			clientAddress: getClientAddress(req),
			httpHeaders: req.headers,
		};

		this.renewTimeout(TIMEOUT / 1000);
		this.ws.on('message', this.handler);
		this.ws.on('close', (...args) => {
			this.lifecycle.emit('disconnected', this);
			this.emit('close', ...args);
			this.subscriptions.clear();
			clearTimeout(this.timeout);
		});

		this.ws.on('error', (err) => {
			console.error('Unexpected error:', err);
			this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
		});

		this.setMaxListeners(50);

		this.greeting();

		this.lifecycle.emit('connected', this);

		this.ws.on('message', () => this.renewTimeout(TIMEOUT));

		this.once('message', ({ msg }) => {
			if (msg !== DDP_EVENTS.CONNECT) {
				return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
			}
			return this.send(this.server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.CONNECTED, session: this.session }));
		});

		this.send(SERVER_ID);
	}

	greeting(): void {
		// no greeting by default
		if (this.meteorClient) {
			return this.ws.send('o');
		}
	}

	async callMethod(packet: IPacket): Promise<void> {
		this.enqueue(() => this.server.call(this, packet));
	}

	async callSubscribe(packet: IPacket): Promise<void> {
		this.enqueue(() => this.server.subscribe(this, packet));
	}

	// A rejected task must not poison the chain, or every later message from this client would be dropped.
	private enqueue(task: () => Promise<void>): void {
		this.chain = this.chain.then(task).catch((err) => {
			console.error('Error processing DDP message:', err);
		});
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
				void this.callMethod(packet);
				break;
			case DDP_EVENTS.SUBSCRIBE:
				if (!packet.name) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				if (!packet.id) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				void this.callSubscribe(packet);
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
		this.send(this.server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PING, ...(id && { [DDP_EVENTS.ID]: id }) }));
	}

	pong(id?: string): void {
		this.send(this.server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PONG, ...(id && { [DDP_EVENTS.ID]: id }) }));
	}

	handleIdle = (): void => {
		this.ping();
		this.timeout = setTimeout(this.closeTimeout, TIMEOUT);
	};

	renewTimeout(timeout = TIMEOUT): void {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(this.handleIdle, timeout);
	}

	handler = async (payload: WebSocket.Data, isBinary: boolean): Promise<void> => {
		try {
			const packet = this.server.parse(payload, isBinary);
			this.updatePresence();
			this.emit('message', packet);
			this.process(packet.msg, packet);
		} catch (err) {
			console.error(err);
			return this.ws.close(WS_ERRORS.UNSUPPORTED_DATA, WS_ERRORS_MESSAGES.UNSUPPORTED_DATA);
		}
	};

	encodePayload(payload: string): string {
		if (this.meteorClient) {
			return `a${JSON.stringify([payload])}`;
		}
		return payload;
	}

	send(payload: string): void {
		return this.ws.send(this.encodePayload(payload));
	}
}
