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
	retryTimer?: NodeJS.Timeout;
	retryTime: number;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected' | 'reconnecting';

export interface Connection
	extends Emitter<{
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

	connect(): Promise<boolean>;

	reconnect(): Promise<boolean>;

	close(): void;
}

interface WebSocketConstructor {
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
		this.url = url.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');

		this.client.onDispatchMessage((message: string) => {
			if (this.ws && this.ws.readyState === this.ws.OPEN) {
				this.ws.send(message);
				return;
			}

			this.queue.add(message);
		});

		this.on('connected', () => {
			this.queue.forEach((message) => {
				this.ws?.send(message);
			});

			this.queue.clear();
		});
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

		this.status = 'connecting';

		const ws = new this.WS(`${this.ssl ? 'wss://' : 'ws://'}${this.url}/websocket`);

		this.ws = ws;

		// Build the in-flight promise and publish it on `this.connectPromise`
		// before emitting any status change, so a synchronous re-entrant
		// caller (an event listener that calls `connect()`/`reconnect()`)
		// hits the `'connecting'` guard and gets this same promise.
		const connectPromise = new Promise<boolean>((resolve, reject) => {
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

				this.client.connect();

				// If the server is willing to speak the version of the protocol specified in the connect message, it sends back a connected message.
				// Otherwise the server sends back a failed message with a version of DDP it would rather speak, informed by the connect message's support field, and closes the underlying transport.

				this.client.onConnection((payload) => {
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
						this.emit('connected', payload.session);
						this.session = payload.session;
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
			};

			ws.onclose = () => {
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
				this.status = 'disconnected';
				this.emitStatus();
				this.emit('disconnected');

				if (this.retryCount >= this.retryOptions.retryCount) {
					return;
				}

				this.retryCount += 1;

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
					void this.reconnect();
				}, this.retryOptions.retryTime * this.retryCount);
			};
		});

		this.connectPromise = connectPromise;

		this.emit('connecting');
		this.emitStatus();

		return connectPromise;
	}

	close() {
		this.status = 'closed';
		this.ws?.close();
		this.emitStatus();
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
