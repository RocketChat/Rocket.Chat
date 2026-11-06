import { Emitter } from '@rocket.chat/emitter';

import type { DDPClient } from './types/DDPClient';

// type Subscription = {
// 	name: string;
// 	params: unknown[];
// 	id: string;
// 	status: 'queued' | 'subscribing' | 'ready' | 'error';
// };

// type Method = {
// 	method: string;
// 	params: unknown[];
// 	id: string;
// 	status: 'queued' | 'calling' | 'ready' | 'error';
// };

type RetryOptions = {
	retryCount: number;
	retryTimer?: ReturnType<typeof setTimeout>;
	retryTime: number;
};

// Caps the backoff so an unlimited retryCount keeps polling a server that is down for a long time.
const MAX_RETRY_DELAY = 30_000;

// Exponential, with jitter so the clients a server restart dropped don't all come back on the same tick.
export const getRetryDelay = (retryTime: number, attempt: number): number =>
	Math.min(retryTime * 2 ** (attempt - 1), MAX_RETRY_DELAY) * (0.5 + Math.random() / 2);

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected' | 'reconnecting';

export interface Connection extends Emitter<{
	connection: ConnectionStatus;
	connecting: void;
	connected: string;
	disconnected: void;
	reconnecting: void;
	close: void;
}> {
	url: string;
	ssl: boolean;

	session?: string;

	status: ConnectionStatus;

	ws?: WebSocket;

	/** How many reconnection attempts were made since the last successful connection. */
	retryCount: number;

	/** When the next reconnection attempt is due (ms since epoch), while one is scheduled. */
	nextRetryAt?: number;

	connect(): Promise<boolean>;

	reconnect(): Promise<boolean>;

	/**
	 * Resolves once the connection is established, right away if it already is; rejects if `close()` is called first.
	 * Doesn't start connecting.
	 */
	whenConnected(): Promise<void>;

	close(): void;
}

export interface WebSocketConstructor {
	new (url: string | URL, protocols?: string | string[]): WebSocket;
}

export class ConnectionImpl
	extends Emitter<{
		connection: ConnectionStatus;
		connecting: void;
		connected: string;
		disconnected: void;
		reconnecting: void;
		close: void;
	}>
	implements Connection
{
	ssl: boolean;

	url: string;

	session?: string;

	status: ConnectionStatus = 'idle';

	ws: WebSocket | undefined;

	retryCount = 0;

	nextRetryAt?: number;

	private connectPromise?: Promise<boolean>;

	public queue = new Set<string>();

	constructor(
		url: string,
		private WS: WebSocketConstructor,
		private client: DDPClient,
		readonly retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	) {
		super();
		this.ssl = url.startsWith('https') || url.startsWith('wss');
		this.url = url
			.replace(/^https?:\/\//, '')
			.replace(/^wss?:\/\//, '')
			.replace(/\/websocket\/?$/, '')
			.replace(/\/$/, '');

		this.client.onDispatchMessage((message: string) => {
			if (this.ws?.readyState === this.ws?.OPEN && (this.status === 'connected' || this.handshaking)) {
				this.ws?.send(message);
				return;
			}

			this.queue.add(message);
		});
	}

	private handshaking = false;

	// The handshake listener of the current socket, dropped as soon as the socket is replaced or closed.
	private stopHandshake?: () => void;

	private flushQueue() {
		this.queue.forEach((message) => {
			this.ws?.send(message);
		});

		this.queue.clear();
	}

	private emitStatus() {
		this.emit('connection', this.status);
	}

	reconnect(): Promise<boolean> {
		// Idempotent — if another caller already started (or finished) a connection
		// since this reconnect was scheduled, we don't need to do anything. The
		// retry timer enqueued by `ws.onclose` runs with no awareness of any
		// concurrent `connect()` (e.g. the consumer's own bootstrap or
		// resume-on-userId-change path), so without this guard a late timer
		// rejected with "Connection in progress" — and because the timer fires
		// from `void this.reconnect()` the rejection became an unhandled
		// rejection at the page level.
		if (this.status === 'connected') {
			clearTimeout(this.retryOptions.retryTimer);
			return Promise.resolve(true);
		}
		if (this.status === 'connecting') {
			// Share the in-flight handshake promise so a `failed` payload
			// later in the same attempt isn't masked by a synthesized success.
			clearTimeout(this.retryOptions.retryTimer);
			return this.connectPromise as Promise<boolean>;
		}

		clearTimeout(this.retryOptions.retryTimer);

		this.emit('reconnecting');

		this.emit('connection', 'reconnecting');

		return this.connect();
	}

	connect() {
		// Same idempotency guard as `reconnect()` — multiple call sites
		// (`reconnect()`, ws.onclose retry timer, external `startConnect`) can
		// race; rejecting forced every caller to wrap in `.catch(() => {})`
		// just to silence noise, and the internal timer's `void this.reconnect()`
		// path didn't have a catch at all.
		if (this.status === 'connected') {
			clearTimeout(this.retryOptions.retryTimer);
			return Promise.resolve(true);
		}
		if (this.status === 'connecting') {
			clearTimeout(this.retryOptions.retryTimer);
			return this.connectPromise as Promise<boolean>;
		}

		this.stopHandshake?.();
		this.nextRetryAt = undefined;
		this.status = 'connecting';

		const ws = new this.WS(`${this.ssl ? 'wss://' : 'ws://'}${this.url}/websocket`);

		this.ws = ws;

		// Build the in-flight promise and publish it on `this.connectPromise`
		// before emitting any status change, so a synchronous re-entrant
		// caller (an event listener that calls `connect()`/`reconnect()`)
		// hits the `'connecting'` guard and gets this same promise.
		const connectPromise = new Promise<boolean>((resolve, reject) => {
			let stopHandshake: (() => void) | undefined;

			ws.onopen = () => {
				ws.onmessage = (event) => {
					this.client.handleMessage(String(event.data));
				};

				// The server may send an initial message which is a JSON object lacking a msg key. If so, the client should ignore it. The client does not have to wait for this message.
				// (The message was once used to help implement Meteor's hot code reload feature; it is now only included to force old clients to update).
				// this.client.onceMessage((data) => {
				// 	if (data.msg === undefined) {
				// 		return;
				// 	}
				// 	if (data.msg === 'failed') {
				// 		return;
				// 	}
				// 	if (data.msg === 'connected') {
				// 		return;
				// 	}
				// 	this.close();
				// });

				// The client sends a connect message.

				// Every other frame waits for `connected`, so frames sent before a failed handshake are never lost.
				this.handshaking = true;
				try {
					this.client.connect();
				} finally {
					this.handshaking = false;
				}

				// If the server is willing to speak the version of the protocol specified in the connect message, it sends back a connected message.
				// Otherwise the server sends back a failed message with a version of DDP it would rather speak, informed by the connect message's support field, and closes the underlying transport.

				stopHandshake = this.client.onConnection((payload) => {
					if (payload.msg === 'connected') {
						this.status = 'connected';
						// Reset the retry budget on successful connection so a future
						// disconnect can schedule reconnects again. Without this,
						// long-lived connections that recover once would burn through
						// `retryCount` permanently and stop reconnecting on subsequent
						// drops — observed when a server-side ws.close (logout, force-
						// logout) chained with a reconnect cycle saturated the
						// budget; the next disconnect left frames stuck in the
						// dispatcher queue forever because the socket never came back.
						this.retryCount = 0;
						this.emitStatus();
						this.session = payload.session;
						// Listeners run first so frames they send (a re-login) precede the queued ones.
						this.emit('connected', payload.session);
						this.flushQueue();
						return resolve(true);
					}
					if (payload.msg === 'failed') {
						this.status = 'failed';
						this.emitStatus();
						this.emit('disconnected');
						return reject(payload.version);
					}
					/* istanbul ignore next */
					reject(new Error('Unknown message type'));
				});
				this.stopHandshake = stopHandshake;
			};

			// The close event that always follows carries the handling; a listener must exist so
			// EventEmitter-based implementations (the `ws` package) don't throw on errors.
			ws.onerror = () => undefined;

			ws.onclose = () => {
				// The handshake listener belongs to this socket; a later attempt registers its own.
				stopHandshake?.();
				// A no-op once the handshake settled the promise.
				reject(new Error('Connection closed before the DDP handshake completed'));

				// If a newer ws has already taken over (this socket was closed
				// after `connect()` opened a replacement), ignore the late
				// onclose. Otherwise its handler would clobber `this.status` and
				// `retryCount`, and could even schedule a redundant retry timer
				// that fires while the new socket is healthy — observed as the
				// "Connection in progress" pageError racing on every reconnect.
				if (this.ws !== ws) {
					return;
				}
				clearTimeout(this.retryOptions.retryTimer);
				if (this.status === 'closed') {
					return;
				}
				// Frames queued while a live socket was dying belong to calls that are reported as lost.
				if (this.status === 'connected') {
					this.queue.clear();
				}
				this.status = 'disconnected';
				this.emitStatus();
				this.emit('disconnected');

				if (this.retryCount >= this.retryOptions.retryCount) {
					return;
				}

				this.retryCount += 1;

				const retryDelay = getRetryDelay(this.retryOptions.retryTime, this.retryCount);
				this.nextRetryAt = Date.now() + retryDelay;
				// Lets status readers pick up when the next attempt is due.
				this.emitStatus();

				this.retryOptions.retryTimer = setTimeout(() => {
					// Re-check the status when the timer actually fires. If the
					// consumer bootstrapped a fresh `connect()` in the meantime
					// (status flipped from 'disconnected' to 'connecting' or
					// 'connected'), there's nothing for us to do. Without this
					// the timer would call `this.reconnect()`, which (pre-this
					// patch) rejected with "Connection in progress" and surfaced
					// as an unhandled rejection.
					if (this.status === 'connecting' || this.status === 'connected' || this.status === 'closed') {
						return;
					}
					// A failed attempt schedules its own retry from its onclose.
					this.reconnect().catch(() => undefined);
				}, retryDelay);
			};
		});

		this.connectPromise = connectPromise;

		this.emit('connecting');
		this.emitStatus();

		return connectPromise;
	}

	whenConnected(): Promise<void> {
		if (this.status === 'connected') {
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			const stopWaitingForClose = this.once('close', () => {
				stopWaitingForConnected();
				reject(new Error('Connection closed before it was established'));
			});
			const stopWaitingForConnected = this.once('connected', () => {
				stopWaitingForClose();
				resolve();
			});
		});
	}

	close() {
		clearTimeout(this.retryOptions.retryTimer);
		this.status = 'closed';
		this.stopHandshake?.();
		// Their calls are rejected on close, so they must not go out on a later connect().
		this.queue.clear();
		this.ws?.close();
		this.emitStatus();
		this.emit('close');
	}

	static create(
		url: string,
		webSocketImpl: WebSocketConstructor,
		client: DDPClient,
		retryOptions: RetryOptions = { retryCount: 0, retryTime: 1000 },
	): ConnectionImpl {
		return new ConnectionImpl(url, webSocketImpl, client, retryOptions);
	}
}
