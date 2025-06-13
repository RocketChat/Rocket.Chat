import type { HomeserverEvent } from '@rocket.chat/core-services';

export abstract class BaseEventHandler {
	protected serviceName: string;

	constructor(serviceName: string) {
		this.serviceName = serviceName;
	}

	public abstract canHandle(event: HomeserverEvent): boolean;
	public abstract handle(event: HomeserverEvent): Promise<void>;

	protected log(message: string, ...args: any[]): void {
		console.log(`[${this.serviceName}] ${message}`, ...args);
	}

	protected error(message: string, error: any): void {
		console.error(`[${this.serviceName}] ${message}`, error);
	}

	protected debug(message: string, ...args: any[]): void {
		if (process.env.DEBUG_FEDERATION) {
			console.debug(`[${this.serviceName}] ${message}`, ...args);
		}
	}
}