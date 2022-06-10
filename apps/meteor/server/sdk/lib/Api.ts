// import { BaseBroker } from './BaseBroker';
import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';
import { EventSignatures } from './Events';
import { LocalBroker } from './LocalBroker';

export class Api {
	private services = new Set<ServiceClass>();

	private broker: IBroker = new LocalBroker();

	// set a broker for the API and registers all services in the broker
	setBroker(broker: IBroker): void {
		this.broker = broker;

		this.services.forEach((service) => this.broker.createService(service));
	}

	destroyService(instance: ServiceClass): void {
		if (!this.services.has(instance)) {
			return;
		}

		if (this.broker) {
			this.broker.destroyService(instance);
		}

		this.services.delete(instance);
	}

	registerService(instance: ServiceClass): void {
		this.services.add(instance);

		if (this.broker) {
			this.broker.createService(instance);
		}
	}

	async call(method: string, data?: unknown): Promise<any> {
		return this.broker.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.broker.waitAndCall(method, data);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, ...args);
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void> {
		return this.broker.broadcastToServices(services, event, ...args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcastLocal(event, ...args);
	}
}
