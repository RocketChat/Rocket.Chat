import type { EventSignatures } from '../events/Events';
import type { IBroker, IBrokerNode } from './IBroker';
import type { IServiceClass } from './ServiceClass';

export interface IApiService {
	setBroker(broker: IBroker): void;

	destroyService(instance: IServiceClass): Promise<void>;

	registerService(instance: IServiceClass): void;

	call(method: string, data?: unknown): Promise<any>;

	waitAndCall(method: string, data: any): Promise<any>;

	broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void>;

	broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void>;

	broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void>;

	nodeList(): Promise<IBrokerNode[]>;
}
