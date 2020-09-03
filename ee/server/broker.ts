import { ServiceBroker } from 'moleculer';

import { api } from '../../sdk/api';
import { onLicense } from '../app/license/server';
import { IBroker } from '../../sdk/types/IBroker';
import { ServiceClass } from '../../sdk/types/ServiceClass';

class NetworkBroker implements IBroker {
	private broker: ServiceBroker;

	constructor(broker: ServiceBroker) {
		this.broker = broker;
	}

	async call(method: string, data: any): Promise<any> {
		return this.broker.call(method, data);
	}

	createService(instance: ServiceClass): void {
		const name = instance.getName();

		const service = {
			name,
			actions: {} as any,
		};

		const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}
			const i = instance as any;

			service.actions[method] = (ctx: any): any => i[method](...ctx.params);
		}

		this.broker.createService(service);
	}
}

onLicense('scalability', async () => {
	const network = new ServiceBroker({
		transporter: 'TCP',
		logLevel: 'debug',
		registry: {
			strategy: 'RoundRobin',
			preferLocal: false,
		},
	});

	await network.start();

	api.setBroker(new NetworkBroker(network));
});
