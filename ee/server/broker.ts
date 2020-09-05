import { ServiceBroker, Context } from 'moleculer';

import { asyncLocalStorage } from '../../server/sdk';
import { api } from '../../server/sdk/api';
import { IBroker, IBrokerNode } from '../../server/sdk/types/IBroker';
import { ServiceClass } from '../../server/sdk/types/ServiceClass';
// import { onLicense } from '../app/license/server';

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

			service.actions[method] = async (ctx: Context<[]>): Promise<any> => asyncLocalStorage.run({
				id: ctx.id,
				nodeID: ctx.nodeID,
				requestID: ctx.requestID,
				broker: this,
			}, (): any => i[method](...ctx.params));
		}

		this.broker.createService(service);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return this.broker.call('$node.list');
	}
}

// onLicense('scalability', async () => {
(async (): Promise<void> => {
	const network = new ServiceBroker({
		transporter: 'TCP',
		// logLevel: 'debug',
		logLevel: {
			// "TRACING": "trace",
			// "TRANS*": "warn",
			BROKER: 'debug',
			TRANSIT: 'debug',
			'**': 'info',
		},
		logger: {
			type: 'Console',
			options: {
				formatter: 'short',
			},
		},
		registry: {
			strategy: 'RoundRobin',
			preferLocal: false,
		},
	});

	await network.start();

	api.setBroker(new NetworkBroker(network));
})();
// });
