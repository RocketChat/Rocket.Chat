import { Emitter } from '@rocket.chat/emitter';

import type { DDPClient } from './types/DDPClient';
import type { PublicationPayloads } from './types/publicationPayloads';
import type { DDPDispatchOptions } from './MinimalDDPClient';
import { DDPDispatcher } from './DDPDispatcher';
import type { MethodPayload } from './types/methodsPayloads';

export interface ClientStream extends Emitter {
	call(method: string, ...params: any[]): string;
	callWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): string;

	callAsync(method: string, ...params: any[]): Promise<any> & { id: string };
	callAsyncWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): Promise<any> & { id: string };

	subscribe(name: string, ...params: any[]): Promise<any> & { id: string };
	unsubscribe(id: string): Promise<any>;
	connect(): Promise<any>;
	onCollection(id: string, callback: (data: PublicationPayloads) => void): () => void;

	subscriptions: Map<
		string,
		{
			id: string;
			status: 'ready' | 'loading';
			name: string;
			params: any[];
		}
	>;
}

export class ClientStreamImpl extends Emitter implements ClientStream {
	subscriptions = new Map<
		string,
		{
			id: string;
			status: 'ready' | 'loading';
			name: string;
			params: any[];
		}
	>();

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

	callAsync(method: string, ...params: any[]): Promise<any> & { id: string } {
		return this.callAsyncWithOptions(method, {}, ...params);
	}

	callAsyncWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): Promise<any> & { id: string } {
		const payload = this.ddp.call(method, params);
		const result = new Promise((resolve, reject) => {
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
		});

		return Object.assign(result, { id: payload.id });
	}

	subscribe(name: string, ...params: any[]): Promise<any> & { id: string } {
		const id = this.ddp.subscribe(name, params);

		this.subscriptions.set(id, {
			id,
			status: 'loading',
			name,
			params,
		});
		const result = new Promise((resolve, reject) => {
			this.ddp.onPublish(id, (payload) => {
				if ('error' in payload) {
					this.subscriptions.delete(id);
					return reject(payload.error);
				}
				this.subscriptions.set(id, {
					id,
					status: 'ready',
					name,
					params,
				});
				resolve(payload);
			});
		});
		return Object.assign(result, { id });
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
