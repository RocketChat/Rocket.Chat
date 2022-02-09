import { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { asyncLocalStorage } from '../../server/sdk';
import { api } from '../../server/sdk/api';
import { IBroker, IBrokerNode, IServiceMetrics } from '../../server/sdk/types/IBroker';
import { ServiceClass } from '../../server/sdk/types/ServiceClass';
import { EventSignatures } from '../../server/sdk/lib/Events';

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
	WAIT_FOR_SERVICES_WHITELIST_TIMEOUT = '600000', // 10 minutes
} = process.env;

const waitForServicesTimeout = parseInt(WAIT_FOR_SERVICES_TIMEOUT, 10) || 10000;
const waitForServicesWhitelistTimeout = parseInt(WAIT_FOR_SERVICES_WHITELIST_TIMEOUT, 10) || 600000;

export class NetworkBroker implements IBroker {
	private broker: ServiceBroker;

	private started: Promise<void>;

	private whitelist = {
		events: ['license.module', 'watch.settings'],
		actions: ['license.hasLicense'],
	};

	metrics: IServiceMetrics;

	constructor(broker: ServiceBroker) {
		this.broker = broker;

		api.setBroker(this);

		this.metrics = broker.metrics;

		this.started = this.broker.start();
	}

	isWhitelisted(list: string[], item: string): boolean {
		return list.includes(item);
	}

	isActionWhitelisted(method: string): boolean {
		return this.isWhitelisted(this.whitelist.actions, method);
	}

	isEventWhitelisted(event: string): boolean {
		return this.isWhitelisted(this.whitelist.events, event);
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
			await this.broker.waitForServices(
				method.split('.')[0],
				this.isActionWhitelisted(method) ? waitForServicesWhitelistTimeout : waitForServicesTimeout,
			);
		} catch (err) {
			console.error(err);
		}

		return this.call(method, data);
	}

	destroyService(instance: ServiceClass): void {
		this.broker.destroyService(instance.getName());
	}

	createService(instance: ServiceClass): void {
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

		const service: ServiceSchema = {
			name,
			actions: {},
			...(name !== 'license'
				? {
						dependencies: ['license'],
				  }
				: {}),
			events: instance.getEvents().reduce<Record<string, Function>>((map, eventName) => {
				map[eventName] = /^\$/.test(eventName)
					? (data: Parameters<EventSignatures[typeof eventName]>): void => {
							instance.emit(eventName, data);
					  }
					: (data: Parameters<EventSignatures[typeof eventName]>): void => {
							instance.emit(eventName, ...data);
					  };
				return map;
			}, {}),
		};

		if (!service.events || !service.actions) {
			return;
		}

		const methods =
			instance.constructor?.name === 'Object'
				? Object.getOwnPropertyNames(instance)
				: Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
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
				service[method] = (): void =>
					asyncLocalStorage.run(
						{
							id: '',
							nodeID: this.broker.nodeID,
							requestID: null,
							broker: this,
						},
						i[method].bind(i),
					);
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
					() => i[method](...ctx.params),
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
