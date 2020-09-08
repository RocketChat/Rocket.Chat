import { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { asyncLocalStorage, License } from '../../server/sdk';
import { api } from '../../server/sdk/api';
import { IBroker, IBrokerNode } from '../../server/sdk/types/IBroker';
import { ServiceClass } from '../../server/sdk/types/ServiceClass';
// import { onLicense } from '../app/license/server';
import { EventSignatures } from '../../server/sdk/lib/Events';
import { LocalBroker } from '../../server/sdk/lib/LocalBroker';

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

	private localBroker = new LocalBroker();

	private allowed = false;

	private whitelist = {
		events: ['license.module'],
		actions: ['license.hasLicense'],
	}

	constructor(broker: ServiceBroker) {
		this.broker = broker;
	}

	async call(method: string, data: any): Promise<any> {
		if (!this.allowed && !this.whitelist.actions.includes(method)) {
			return this.localBroker.call(method, data);
		}

		await this.broker.waitForServices(method.split('.')[0]);
		return this.broker.call(method, data);
	}

	createService(instance: ServiceClass): void {
		this.localBroker.createService(instance);

		const name = instance.getName();

		// Listen for module license
		instance.onEvent('license.module', async ({ module, valid }) => {
			if (module === 'scalability') {
				// Should we believe on the event only? Could it be a call from the CE version?
				this.allowed = valid && await License.hasLicense('scalability');
				console.log('on license.module', { allowed: this.allowed });
			}
		});

		const service: ServiceSchema = {
			name,
			actions: {},
			// Prevent listen events when not allowed except by `license.module`
			events: Object.fromEntries(Object.entries(instance.getEvents()).map(([event, fn]) => {
				if (!this.whitelist.events.includes(event)) {
					const originalFn = fn;
					fn = (...args: any[]): any => {
						if (this.allowed) {
							return originalFn(...args);
						}
					};
				}
				return [event, (data: any[]): void => fn(...data)];
			})),
			started: async (): Promise<void> => {
				if (name === 'license') {
					return;
				}

				this.allowed = await License.hasLicense('scalability');
				console.log('on started', { allowed: this.allowed });
			},
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
			}, (): any => {
				if (this.allowed || this.whitelist.actions.includes(`${ name }.${ method }`)) {
					return i[method](...ctx.params);
				}
			});
		}

		this.broker.createService(service);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		if (!this.allowed && !this.whitelist.events.includes(event)) {
			return this.localBroker.broadcast(event, ...args);
		}
		return this.broker.broadcast(event, args);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return this.broker.call('$node.list');
	}
}

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

api.setBroker(new NetworkBroker(network));

network.start();
