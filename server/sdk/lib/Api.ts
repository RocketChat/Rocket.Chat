// import { BaseBroker } from './BaseBroker';
import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';
import { EventSignatures } from './Events';
import { LocalBroker } from './LocalBroker';

export class Api {
	private services = new Set<ServiceClass>();

	private broker: IBroker = new LocalBroker();

	private middlewares: Record<string, Array<(...args: any[]) => any>> = {};

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

	use(method: string, callback: any): void {
		if (typeof this.middlewares[method] === 'undefined') {
			this.middlewares[method] = [];
		}
		this.middlewares[method].push(callback);
	}

	async call(method: string, data: any): Promise<any> {
		this.middlewares[method]?.forEach((callback) => callback(...data));

		return this.broker.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		this.middlewares[method]?.forEach((callback) => callback(...data));

		return this.broker.waitAndCall(method, data);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, ...args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcastLocal(event, ...args);
	}
}
