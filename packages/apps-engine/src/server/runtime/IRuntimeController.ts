import type { EventEmitter } from 'events';

import type { AppStatus } from '../../definition/AppStatus';

export type RuntimeRequestOptions = {
	timeout: number;
};

export interface IRuntimeController extends EventEmitter {
	/**
	 * Get the current status of the app runtime
	 */
	getStatus(): Promise<AppStatus>;

	/**
	 * Send a request to the app runtime
	 */
	sendRequest(message: { method: string; params: any[] }, options?: RuntimeRequestOptions): Promise<unknown>;

	/**
	 * Setup the app runtime
	 */
	setupApp(): Promise<void>;

	/**
	 * Stop the app runtime
	 */
	stopApp(): Promise<void>;

	/**
	 * Get the app ID associated with this runtime
	 */
	getAppId(): string;
}
