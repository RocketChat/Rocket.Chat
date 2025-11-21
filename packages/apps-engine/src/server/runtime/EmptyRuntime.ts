import { EventEmitter } from 'events';

import type { IRuntimeController, RuntimeRequestOptions } from './IRuntimeController';
import { AppStatus } from '../../definition/AppStatus';

export class EmptyRuntime extends EventEmitter implements IRuntimeController {
	private readonly appId: string;

	constructor(appId: string) {
		super();
		this.appId = appId;
	}

	/**
	 * Returns a disabled status since this is an empty runtime
	 */
	public async getStatus(): Promise<AppStatus> {
		return Promise.resolve(AppStatus.COMPILER_ERROR_DISABLED);
	}

	/**
	 * Stub implementation that throws an error since this runtime cannot handle requests
	 */
	public async sendRequest(message: { method: string; params: any[] }, options?: RuntimeRequestOptions): Promise<unknown> {
		throw new Error(`EmptyRuntime cannot handle requests. Method: ${message.method}`);
	}

	/**
	 * Stub implementation for setting up the runtime
	 */
	public async setupApp(): Promise<void> {
		// Nothing to setup in an empty runtime
		return Promise.resolve();
	}

	/**
	 * Stub implementation for stopping the runtime
	 */
	public async stopApp(): Promise<void> {
		// Nothing to stop in an empty runtime
		return Promise.resolve();
	}

	/**
	 * Get the app ID associated with this runtime
	 */
	public getAppId(): string {
		return this.appId;
	}
}
