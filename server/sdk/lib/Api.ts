// import { BaseBroker } from './BaseBroker';
import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';
import { EventSignatures } from './Events';
import { LocalBroker } from './LocalBroker';

const {
	INTERNAL_SERVICES_ONLY = 'false',
	SERVICES_ALLOWED = '',
} = process.env;

export class Api {
	private services = new Set<ServiceClass>();

	private broker: IBroker = new LocalBroker();

	// wether only internal services are allowed to be registered
	private internalOnly = ['true', 'yes'].includes(INTERNAL_SERVICES_ONLY.toLowerCase());

	// list of allowed services to run - has precedence over `internalOnly`
	private allowedList = new Set<string>(SERVICES_ALLOWED?.split(','));

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
		if (!this.isServiceAllowed(instance)) {
			return;
		}
		this.services.add(instance);

		if (this.broker) {
			this.broker.createService(instance);
		}
	}

	async call(method: string, data: any): Promise<any> {
		return this.broker.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.broker.waitAndCall(method, data);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, ...args);
	}

	private isServiceAllowed(instance: ServiceClass): boolean {

		// check if the service is in the list of allowed services if the list is not empty
		if (this.allowedList.size > 0 && !this.allowedList.has(instance.getName())) {
			return false;
		}

		// allow only internal services if internalOnly is true
		if (this.internalOnly && !instance.isInternal()) {
			return false;
		}

		return true;
	}
}
