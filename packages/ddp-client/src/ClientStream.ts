import { Emitter } from '@rocket.chat/emitter';

import { DDPDispatcher } from './DDPDispatcher';
import type { DDPDispatchOptions } from './MinimalDDPClient';
import type { ClientStream } from './types/ClientStream';
import type { DDPClient } from './types/DDPClient';
import type { Subscription } from './types/Subscription';
import type { MethodPayload } from './types/methodsPayloads';
import type { PublicationPayloads } from './types/publicationPayloads';

/**
 * Rejection of a method call whose frame went out on a connection that dropped before the result arrived.
 * The server may or may not have run the method.
 */
export class ConnectionLostError extends Error {
	constructor() {
		super('Connection lost before the method result arrived');
		this.name = 'ConnectionLostError';
	}
}

type PendingMethod = {
	payload: MethodPayload;
	options?: DDPDispatchOptions;
	sent: boolean;
	held: boolean;
	// A call of the new session itself (its login): goes out while holding and is never resent.
	session: boolean;
	fail: (error: unknown) => void;
};

export class ClientStreamImpl extends Emitter implements ClientStream {
	subscriptions = new Map<string, Subscription>();

	private pending = new Map<string, PendingMethod>();

	private holding = false;

	private sessionCalls = false;

	constructor(
		private ddp: DDPClient,
		readonly dispatcher: DDPDispatcher = new DDPDispatcher(),
	) {
		ddp.onConnection(({ msg }) => {
			if (msg === 'connected') {
				this.emit('connected');
			}
		});
		super();

		dispatcher.on('send', (payload) => {
			if (payload.msg !== 'method') return;
			const method = this.pending.get(payload.id);
			if (method) method.sent = true;
		});
	}

	private apply({
		payload: ddpCallPayload,
		options,
		callback,
	}: {
		payload: MethodPayload;
		callback?: (...args: any[]) => void;
		options?: DDPDispatchOptions;
	}): string {
		const settle = () => {
			stopListening();
			this.pending.delete(ddpCallPayload.id);
			this.dispatcher.removeItem(ddpCallPayload);
		};

		const stopListening = this.ddp.onResult(ddpCallPayload.id, (payload) => {
			settle();
			if (typeof callback === 'function') {
				if ('error' in payload) {
					callback(payload.error);
				} else {
					callback(null, payload.result);
				}
			}
		});

		const held = this.holding && !this.sessionCalls;
		this.pending.set(ddpCallPayload.id, {
			payload: ddpCallPayload,
			options,
			sent: false,
			held,
			session: this.sessionCalls,
			fail: (error) => {
				settle();
				callback?.(error);
			},
		});

		if (!held) {
			this.dispatcher.dispatch(ddpCallPayload, options);
		}

		return ddpCallPayload.id;
	}

	/**
	 * Fails every method call already handed to the transport; calls still held behind a wait
	 * method are released to the transport instead.
	 */
	rejectInFlight(error: unknown = new ConnectionLostError()): void {
		[...this.pending.values()].filter(({ sent }) => sent).forEach(({ fail }) => fail(error));
	}

	/** Fails every pending method call, sent or not; none of them goes out afterwards. */
	rejectAll(error: unknown = new ConnectionLostError()): void {
		this.holding = false;
		this.dispatcher.queue = [];
		[...this.pending.values()].forEach(({ fail }) => fail(error));
	}

	/**
	 * Keeps every unanswered method call, and every call made until `releaseHeld()`, aside so the calls of the
	 * next session (its login, see `sendSessionCalls()`) go first. A lost session call is rejected instead.
	 */
	holdInFlight(): void {
		this.holding = true;
		this.dispatcher.queue = [];
		[...this.pending.values()].forEach((method) => {
			if (method.session) {
				method.fail(new ConnectionLostError());
				return;
			}
			method.sent = false;
			method.held = true;
		});
	}

	/** Runs `fn`, sending the calls it makes right away even while calls are held. */
	sendSessionCalls<T>(fn: () => T): T {
		this.sessionCalls = true;
		try {
			return fn();
		} finally {
			this.sessionCalls = false;
		}
	}

	/**
	 * Hands the calls kept by `holdInFlight()` to the transport again, in call order, as Meteor does after a
	 * reconnection. A call whose frame did reach the server runs twice.
	 */
	releaseHeld(): void {
		this.holding = false;
		[...this.pending.values()]
			.filter(({ held }) => held)
			.forEach((method) => {
				method.held = false;
				this.dispatcher.dispatch(method.payload, method.options);
			});
	}

	call(method: string, ...params: any[]): string {
		// get the last argument
		return this.callWithOptions(method, {}, ...params);
	}

	callWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): string {
		const callback = typeof params[params.length - 1] === 'function' ? params.pop() : undefined;

		const payload = this.ddp.call(method, params);

		this.apply({ payload, callback, options });

		return payload.id;
	}

	callAsync(method: string, ...params: any[]) {
		return this.callAsyncWithOptions(method, {}, ...params);
	}

	callAsyncWithOptions(
		method: string,
		options: DDPDispatchOptions,
		...params: any[]
	): Promise<any> & {
		id: string;
	} {
		const payload = this.ddp.call(method, params);
		return Object.assign(
			new Promise((resolve, reject) => {
				this.apply({
					payload,
					options,
					callback: (error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					},
				});
			}),
			{
				id: payload.id,
			},
		);
	}

	subscribe(name: string, ...params: any[]) {
		const id = this.ddp.subscribe(name, params);

		// oxlint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		// Kept for the whole subscription: a resubscription after a reconnect answers again.
		const stopListening = self.ddp.onPublish(id, (payload) => {
			if (payload.msg === 'ready') {
				result.isReady = true;
				return;
			}
			if (payload.msg !== 'nosub') {
				return;
			}
			stopListening();
			result.isReady = false;
			result.error = payload.error ?? new Error(`Subscription ${name} was stopped by the server`);
			this.subscriptions.delete(id);
			stopListeners.forEach((listener) => listener(result.error));
		});

		const stopListeners = new Set<(error: unknown) => void>();

		const changeListenerRemovers = new Set<() => void>();

		const stop = () => {
			stopListening();
			changeListenerRemovers.forEach((remove) => remove());
			self.subscriptions.delete(id);
			self.ddp.unsubscribe(id);
		};

		const result: Subscription = {
			id,
			name,
			params,
			async ready() {
				if (result.isReady) {
					return;
				}

				if (!self.subscriptions.has(id)) {
					throw result.error ?? new Error(`Subscription ${name} was stopped`);
				}

				return new Promise((resolve, reject) => {
					const stopWaiting = self.ddp.onPublish(id, (payload) => {
						if (payload.msg !== 'ready' && payload.msg !== 'nosub') {
							return;
						}
						stopWaiting();
						if (payload.msg === 'ready') {
							resolve();
							return;
						}
						reject(result.error);
					});
				});
			},
			isReady: false,
			onChange: (cb) => {
				// Gone once the subscription ends: on stop(), or right after delivering the server's nosub.
				const remove = self.ddp.onPublish(id, (payload) => {
					cb(payload);
					if (payload.msg === 'nosub') {
						remove();
						changeListenerRemovers.delete(remove);
					}
				});
				changeListenerRemovers.add(remove);
			},
			onStop: (listener) => {
				stopListeners.add(listener);
				return () => {
					stopListeners.delete(listener);
				};
			},

			stop,
		};

		this.subscriptions.set(id, result);

		return result;
	}

	unsubscribe(id: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.subscriptions.delete(id);
			this.ddp.unsubscribe(id);
			this.ddp.onNoSub(id, (payload) => {
				if ('error' in payload) {
					reject(payload.error);
				} else {
					resolve(payload);
				}
			});
		});
	}

	connect(): Promise<any> {
		this.ddp.connect();
		return new Promise((resolve, reject) => {
			this.ddp.onConnection((data) => {
				if (data.msg === 'failed') reject(data);
				else resolve(data);
			});
		});
	}

	onCollection(id: string, callback: (data: PublicationPayloads) => void) {
		return this.ddp.onCollection(id, callback);
	}
}
