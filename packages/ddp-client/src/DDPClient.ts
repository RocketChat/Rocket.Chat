import type { DDPMethods } from './ClassMinimalDDPClient';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface DDPClient {
	call(method: string, ...params: any[]): string;
	callAsync(method: string, ...params: any[]): Promise<any> & { id: string };
	subscribe(name: string, ...params: any[]): Promise<any> & { id: string };
	unsubscribe(id: string): Promise<any>;
	connect(): Promise<any>;
	onCollection(id: string, callback: (data: any) => void): () => void;
}

export class DDPClientImpl implements DDPClient {
	constructor(private ws: DDPMethods) {}

	call(method: string, ...params: any[]): string {
		// get the last argument
		const callback = params.pop();
		// if it's not a function, then push it back
		if (typeof callback !== 'function') {
			params.push(callback);
		}

		const id = this.ws.call(method, ...params);

		if (typeof callback === 'function') {
			this.ws.onResult(id, (payload) => {
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
		const id = this.ws.call(method, ...params);

		const result = new Promise((resolve, reject) => {
			this.ws.onResult(id, (payload) => {
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
		const id = this.ws.subscribe(name, ...params);
		const result = new Promise((resolve, reject) => {
			this.ws.onPublish(id, (payload) => {
				if ('error' in payload) {
					reject(payload.error);
				} else {
					resolve(payload);
				}
			});
		});
		return Object.assign(result, { id });
	}

	unsubscribe(id: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.ws.unsubscribe(id);
			this.ws.onNoSub(id, (payload) => {
				if ('error' in payload) {
					reject(payload.error);
				} else {
					resolve(payload);
				}
			});
		});
	}

	connect(): Promise<any> {
		this.ws.connect();
		return new Promise((resolve, reject) => {
			this.ws.onConnection((data) => {
				if (data.msg === 'failed') reject(data);
				else resolve(data);
			});
		});
	}

	onCollection(id: string, callback: (data: any) => void) {
		return this.ws.onCollection(id, callback);
	}
}
