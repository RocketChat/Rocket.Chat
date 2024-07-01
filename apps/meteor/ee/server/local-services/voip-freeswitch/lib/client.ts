import type { Logger } from '@rocket.chat/logger';
import { type FreeSwitchResponse, FreeSwitchClient } from 'esl';

export class FreeSwitchRCClient {
	private client: FreeSwitchClient;

	constructor({ host, port, password, logger }: { host: string; port: number; password: string; logger: Logger }) {
		this.client = new FreeSwitchClient({
			host,
			port: port || 8021,
			...(password ? { password } : {}),
			logger: Object.fromEntries(
				(['debug', 'info', 'error'] as const).map((fn) => {
					return [
						fn,
						(...args: any[]) => {
							logger[fn]({
								msg: 'FreeSwitchLog',
								host,
								[fn]: args,
							});
						},
					];
				}),
			) as Record<'debug' | 'info' | 'error', (...args: any[]) => void>,
		});
	}

	public async connect(): Promise<FreeSwitchResponse> {
		return new Promise((resolve, reject) => {
			let promisePending = true;
			const errorHandler = (e: unknown) => {
				if (promisePending) {
					return;
				}

				reject(e);
			};

			this.client.once('error', errorHandler);
			this.client.once('connect', (call) => {
				promisePending = false;
				resolve(call);
			});

			try {
				this.client.connect();
			} catch (e) {
				promisePending = false;
				reject(e);
			}
		});
	}

	public async end(): Promise<void> {
		return this.client.end();
	}
}
