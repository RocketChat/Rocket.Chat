import type { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { asyncLocalStorage } from '../../server/sdk';
import type { IBroker, IBrokerNode, IServiceMetrics } from '../../server/sdk/types/IBroker';
import type { ServiceClass } from '../../server/sdk/types/ServiceClass';
import type { EventSignatures } from '../../server/sdk/lib/Events';

const events: { [k: string]: string } = {
	onNodeConnected: '$node.connected',
	onNodeUpdated: '$node.updated',
	onNodeDisconnected: '$node.disconnected',
};

const lifecycle: { [k: string]: string } = {
	created: 'created',
	started: 'started',
	stopped: 'stopped',
};

const {
	WAIT_FOR_SERVICES_TIMEOUT = '10000', // 10 seconds
} = process.env;

const waitForServicesTimeout = parseInt(WAIT_FOR_SERVICES_TIMEOUT, 10) || 10000;

export class NetworkBroker implements IBroker {
	private broker: ServiceBroker;

	private started: Promise<void>;

	metrics: IServiceMetrics;

	constructor(broker: ServiceBroker) {
		this.broker = broker;

		this.metrics = broker.metrics;

		this.started = this.broker.start();
	}

	async call(method: string, data: any): Promise<any> {
		await this.started;

		const context = asyncLocalStorage.getStore();

		if (context?.ctx?.call) {
			return context.ctx.call(method, data);
		}

		const services: { name: string }[] = await this.broker.call('$node.services', {
			onlyAvailable: true,
		});
		if (!services.find((service) => service.name === method.split('.')[0])) {
			return new Error('method-not-available');
		}
		return this.broker.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		await this.started;

		try {
			await this.broker.waitForServices(method.split('.')[0], waitForServicesTimeout);
		} catch (err) {
			console.error(err);
		}

		const context = asyncLocalStorage.getStore();
		if (context?.ctx?.call) {
			return context.ctx.call(method, data);
		}

		return this.broker.call(method, data);
	}

	destroyService(instance: ServiceClass): void {
		this.broker.destroyService(instance.getName());
	}

	createService(instance: ServiceClass): void {
		const methods = (
			instance.constructor?.name === 'Object'
				? Object.getOwnPropertyNames(instance)
				: Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
		).filter((name) => name !== 'constructor');

		if (!instance.getEvents() || !methods.length) {
			return;
		}

		const serviceInstance = instance as any;

		const name = instance.getName();

		if (!instance.isInternal()) {
			instance.onEvent('shutdown', async (services) => {
				if (!services[name]?.includes(this.broker.nodeID)) {
					this.broker.logger.debug({ msg: 'Not shutting down, different node.', nodeID: this.broker.nodeID });
					return;
				}
				this.broker.logger.info({ msg: 'Received shutdown event, destroying service.', nodeID: this.broker.nodeID });
				this.destroyService(instance);
			});
		}

		const dependencies = name !== 'license' ? { dependencies: ['license'] } : {};

		const service: ServiceSchema = {
			name,
			actions: {},
			...dependencies,
			events: instance.getEvents().reduce<Record<string, (ctx: Context) => void>>((map, eventName) => {
				map[eventName] = /^\$/.test(eventName)
					? (ctx: Context): void => {
							// internal events params are not an array
							instance.emit(eventName, ctx.params as Parameters<EventSignatures[typeof eventName]>);
					  }
					: (ctx: Context): void => {
							instance.emit(eventName, ...(ctx.params as Parameters<EventSignatures[typeof eventName]>));
					  };
				return map;
			}, {}),
		};

		if (!service.events || !service.actions) {
			return;
		}

		for (const method of methods) {
			if (method.match(/^on[A-Z]/)) {
				service.events[events[method]] = serviceInstance[method].bind(serviceInstance);
				continue;
			}

			if (lifecycle[method]) {
				service[method] = (): void => {
					asyncLocalStorage.run(
						{
							id: '',
							nodeID: this.broker.nodeID,
							requestID: null,
							broker: this,
						},
						serviceInstance[method].bind(serviceInstance),
					);
				};
				continue;
			}

			service.actions[method] = async (ctx: Context<[]>): Promise<any> => {
				return asyncLocalStorage.run(
					{
						id: ctx.id,
						nodeID: ctx.nodeID,
						requestID: ctx.requestID,
						broker: this,
						ctx,
					},
					() => serviceInstance[method](...ctx.params),
				);
			};
		}

		this.broker.createService(service);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.broker.broadcastLocal(event, args);
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void> {
		this.broker.broadcast(event, args, services);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return this.broker.call('$node.list');
	}
}
