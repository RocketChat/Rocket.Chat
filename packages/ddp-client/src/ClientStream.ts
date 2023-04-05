import type { DDPClient } from './types/DDPClient';
import type { PublicationPayloads } from './types/publicationPayloads';

export interface ClientStream {
	call(method: string, ...params: any[]): string;
	callAsync(method: string, ...params: any[]): Promise<any> & { id: string };
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

export class ClientStreamImpl implements ClientStream {
	subscriptions = new Map<
		string,
		{
			id: string;
			status: 'ready' | 'loading';
			name: string;
			params: any[];
		}
	>();

	constructor(private ddp: DDPClient) {}

	call(method: string, ...params: any[]): string {
		// get the last argument
		const callback = params.pop();
		// if it's not a function, then push it back
		if (typeof callback !== 'function') {
			params.push(callback);
		}

		const id = this.ddp.call(method, ...params);

		if (typeof callback === 'function') {
			this.ddp.onResult(id, (payload) => {
				if ('error' in payload) {
					callback(payload.error);
				} else {
					callback(null, payload.result);
				}
			});
		}
		return id;
	}

	callAsync(method: string, ...params: any[]): Promise<any> & { id: string } {
		const id = this.ddp.call(method, ...params);

		const result = new Promise((resolve, reject) => {
			this.ddp.onResult(id, (payload) => {
				if ('error' in payload) {
					reject(payload.error);
				} else {
					resolve(payload.result);
				}
			});
		});

		return Object.assign(result, { id });
	}

	subscribe(name: string, ...params: any[]): Promise<any> & { id: string } {
		const id = this.ddp.subscribe(name, ...params);

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
