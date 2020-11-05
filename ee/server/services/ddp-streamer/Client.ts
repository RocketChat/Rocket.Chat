import { EventEmitter } from 'events';

import { v1 as uuidv1 } from 'uuid';
import WebSocket from 'ws';

import { DDP_EVENTS, WS_ERRORS, WS_ERRORS_MESSAGES, TIMEOUT } from './constants';
import { SERVER_ID } from './Server';
import { server } from './configureServer';
import { IPacket } from './types/IPacket';

interface IConnection {
	livechatToken?: string;
	onClose(fn: (...args: any[]) => void): void;
}

export class Client extends EventEmitter {
	private chain = Promise.resolve();

	protected timeout: NodeJS.Timeout;

	public readonly session = uuidv1();

	public subscriptions = new Map();

	public connection: IConnection;

	public wait = false;

	public userId?: string;

	public userToken?: string;

	constructor(
		public ws: WebSocket,
		public meteorClient = false,
	) {
		super();

		this.connection = {
			onClose: (fn): void => {
				this.on('close', fn);
			},
		};

		this.renewTimeout(TIMEOUT / 1000);
		this.ws.on('message', this.handler);
		this.ws.on('close', (...args) => {
			server.emit(DDP_EVENTS.DISCONNECTED, this);
			this.emit('close', ...args);
			this.subscriptions.clear();
			clearTimeout(this.timeout);
		});

		this.setMaxListeners(50);

		this.greeting();

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

	greeting(): void {
		// no greeting by default
		if (this.meteorClient) {
			return this.ws.send('o');
		}
	}

	async callMethod(packet: IPacket): Promise<void> {
		this.chain = this.chain.then(() => server.call(this, packet)).catch();
	}

	async callSubscribe(packet: IPacket): Promise<void> {
		this.chain = this.chain.then(() => server.subscribe(this, packet)).catch();
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
				this.callMethod(packet);
				break;
			case DDP_EVENTS.SUBSCRIBE:
				if (!packet.name) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				if (!packet.id) {
					return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
				}
				this.callSubscribe(packet);
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
			if (this.wait) {
				return new Promise((resolve) => this.once(DDP_EVENTS.LOGGED, () => resolve(this.process(packet.msg, packet))));
			}
			this.process(packet.msg, packet);
		} catch (err) {
			console.error(err);
			return this.ws.close(
				WS_ERRORS.UNSUPPORTED_DATA,
				WS_ERRORS_MESSAGES.UNSUPPORTED_DATA,
			);
		}
	};

	encodePayload(payload: string): string {
		if (this.meteorClient) {
			return `a${ JSON.stringify([payload]) }`;
		}
		return payload;
	}

	send(payload: string): void {
		return this.ws.send(this.encodePayload(payload));
	}
}

// TODO implement meteor errors
// a["{\"msg\":\"result\",\"id\":\"12\",\"error\":{\"isClientSafe\":true,\"error\":403,\"reason\":\"User has no password set\",\"message\":\"User has no password set [403]\",\"errorType\":\"Meteor.Error\"}}"]
