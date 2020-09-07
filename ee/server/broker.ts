import { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { asyncLocalStorage } from '../../server/sdk';
import { api } from '../../server/sdk/api';
import { IBroker, IBrokerNode } from '../../server/sdk/types/IBroker';
import { ServiceClass } from '../../server/sdk/types/ServiceClass';
// import { onLicense } from '../app/license/server';
import { EventSignatures } from '../../server/sdk/lib/Events';

const events: {[k: string]: string} = {
	onNodeConnected: '$node.connected',
	onNodeUpdated: '$node.updated',
	onNodeDisconnected: '$node.disconnected',
};

const lifecycle: {[k: string]: string} = {
	created: 'created',
	started: 'started',
	stopped: 'stopped',
};

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

		const service: ServiceSchema = {
			name,
			actions: {},
			events: {},
		};

		if (!service.events || !service.actions) {
			return;
		}

		const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}

			const i = instance as any;

			if (method.match(/^on[A-Z]/)) {
				service.events[events[method]] = i[method].bind(i);
				continue;
			}

			if (lifecycle[method]) {
				service[method] = i[method].bind(i);
				continue;
			}

			service.actions[method] = async (ctx: Context<[]>): Promise<any> => asyncLocalStorage.run({
				id: ctx.id,
				nodeID: ctx.nodeID,
				requestID: ctx.requestID,
				broker: this,
			}, (): any => i[method](...ctx.params));
		}

		this.broker.createService(service);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, args);
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
