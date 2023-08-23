import { Emitter } from '@rocket.chat/emitter';

import { DDPDispatcher } from './DDPDispatcher';
import type { DDPDispatchOptions } from './MinimalDDPClient';
import type { ClientStream } from './types/ClientStream';
import type { DDPClient } from './types/DDPClient';
import type { Subscription } from './types/Subscription';
import type { MethodPayload } from './types/methodsPayloads';
import type { PublicationPayloads } from './types/publicationPayloads';

export class ClientStreamImpl extends Emitter implements ClientStream {
	subscriptions = new Map<string, Subscription>();

	constructor(private ddp: DDPClient, readonly dispatcher: DDPDispatcher = new DDPDispatcher()) {
		super();
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
		this.dispatcher.dispatch(ddpCallPayload, options);

		this.ddp.onResult(ddpCallPayload.id, (payload) => {
			this.dispatcher.removeItem(ddpCallPayload);
			if (typeof callback === 'function') {
				if ('error' in payload) {
					callback(payload.error);
				} else {
					callback(null, payload.result);
				}
			}
		});

		return ddpCallPayload.id;
	}

	call(method: string, ...params: any[]): string {
		// get the last argument
		return this.callWithOptions(method, {}, ...params);
	}

	callWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): string {
		// get the last argument
		const callback = params.pop();
		// if it's not a function, then push it back
		if (typeof callback !== 'function') {
			params.push(callback);
		}

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

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		const s = self.ddp.onPublish(id, (payload) => {
			if ('error' in payload) {
				result.error = payload.error;
				this.subscriptions.delete(id);
				return;
			}
			result.isReady = true;
			this.subscriptions.set(id, {
				...result,
				isReady: true,
			});
		});

		const stop = () => {
			s();
			self.unsubscribe(id);
		};

		const result: Subscription = {
			id,
			name,
			params,
			async ready() {
				const subscription = self.subscriptions.get(id);
				if (!subscription) {
					return Promise.reject(result.error);
				}

				if (subscription.isReady) {
					return Promise.resolve();
				}

				return new Promise((resolve, reject) => {
					this.onChange((payload) => {
						if ('error' in payload) {
							reject(payload.error);
							return;
						}
						resolve();
					});
				});
			},
			isReady: false,
			onChange: (cb) => {
				self.ddp.onPublish(id, cb);
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
