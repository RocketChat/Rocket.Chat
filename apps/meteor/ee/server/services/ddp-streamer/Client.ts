import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

import { v1 as uuidv1 } from 'uuid';
import WebSocket from 'ws';
import type { ISocketConnection } from '@rocket.chat/core-typings';

import { DDP_EVENTS, WS_ERRORS, WS_ERRORS_MESSAGES, TIMEOUT } from './constants';
import { SERVER_ID } from './Server';
import { server } from './configureServer';
import { IPacket } from './types/IPacket';

// TODO why localhost not as 127.0.0.1?
// based on Meteor's implementation (link)
const getClientAddress = (req: IncomingMessage): string | undefined => {
	// For the reported client address for a connection to be correct,
	// the developer must set the HTTP_FORWARDED_COUNT environment
	// variable to an integer representing the number of hops they
	// expect in the `x-forwarded-for` header. E.g., set to "1" if the
	// server is behind one proxy.
	//
	// This could be computed once at startup instead of every time.
	const httpForwardedCount = parseInt(process.env.HTTP_FORWARDED_COUNT || '') || 0;

	if (httpForwardedCount === 0) {
		return req.socket.remoteAddress;
	}

	const forwardedFor =
		(req.headers['x-forwarded-for'] && Array.isArray(req.headers['x-forwarded-for'])
			? req.headers['x-forwarded-for'][0]
			: req.headers['x-forwarded-for']) || '';
	if (!forwardedFor) {
		return;
	}
	const forwardedForClean = forwardedFor
		.trim()
		.split(',')
		.map((ip) => ip.trim());

	// Typically the first value in the `x-forwarded-for` header is
	// the original IP address of the client connecting to the first
	// proxy.  However, the end user can easily spoof the header, in
	// which case the first value(s) will be the fake IP address from
	// the user pretending to be a proxy reporting the original IP
	// address value.  By counting HTTP_FORWARDED_COUNT back from the
	// end of the list, we ensure that we get the IP address being
	// reported by *our* first proxy.

	if (httpForwardedCount < 0 || httpForwardedCount > forwardedForClean.length) {
		return;
	}

	return forwardedForClean[forwardedForClean.length - httpForwardedCount];
};

export class Client extends EventEmitter {
	private chain = Promise.resolve();

	protected timeout: NodeJS.Timeout;

	public readonly session = uuidv1();

	public subscriptions = new Map();

	public connection: ISocketConnection;

	public wait = false;

	public userId?: string;

	public userToken?: string;

	constructor(public ws: WebSocket, public meteorClient = false, req: IncomingMessage) {
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
			server.emit(DDP_EVENTS.DISCONNECTED, this);
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

		server.emit(DDP_EVENTS.CONNECTED, this);

		this.ws.on('message', () => this.renewTimeout(TIMEOUT));

		this.once('message', ({ msg }) => {
			if (msg !== DDP_EVENTS.CONNECT) {
				return this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR, WS_ERRORS_MESSAGES.CLOSE_PROTOCOL_ERROR);
			}
			return this.send(server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.CONNECTED, session: this.session }));
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
		this.send(server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PING, ...(id && { [DDP_EVENTS.ID]: id }) }));
	}

	pong(id?: string): void {
		this.send(server.serialize({ [DDP_EVENTS.MSG]: DDP_EVENTS.PONG, ...(id && { [DDP_EVENTS.ID]: id }) }));
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
			const packet = server.parse(payload, isBinary);
			this.emit('message', packet);
			if (this.wait) {
				return new Promise((resolve) => this.once(DDP_EVENTS.LOGGED, () => resolve(this.process(packet.msg, packet))));
			}
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
