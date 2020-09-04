// import { BaseBroker } from './BaseBroker';
import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';

export class Api {
	private services: ServiceClass[] = [];

	private broker: IBroker;

	// set a broker for the API and registers all services in the broker
	setBroker(broker: IBroker): void {
		this.broker = broker;

		this.services.forEach((service) => this.broker.createService(service));
	}

	registerService(instance: ServiceClass): void {
		this.services.push(instance);

		if (this.broker) {
			this.broker.createService(instance);
		}
	}

	async call(method: string, data: any): Promise<any> {
		return this.broker.call(method, data);
	}
}
