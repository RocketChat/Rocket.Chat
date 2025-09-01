import { asyncLocalStorage } from '@rocket.chat/core-services';
import type { CallingOptions, IBroker, IBrokerNode, IServiceMetrics, IServiceClass, EventSignatures } from '@rocket.chat/core-services';
import { injectCurrentContext, tracerSpan } from '@rocket.chat/tracing';
import type { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { EnterpriseCheck } from './EnterpriseCheck';

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

export class NetworkBroker implements IBroker {
	private broker: ServiceBroker;

	private started: Promise<boolean> = Promise.resolve(false);

	private defaultDependencies = ['settings', 'license'];

	metrics: IServiceMetrics;

	constructor(broker: ServiceBroker) {
		this.broker = broker;

		this.metrics = broker.metrics;
	}

	async call(method: string, data: any, options?: CallingOptions): Promise<any> {
		if (!(await this.started)) {
			return;
		}

		const context = asyncLocalStorage.getStore();

		if (context?.ctx?.call) {
			if (data?.[0]?.stream) {
				// If the first item on the data is an stream, pass the stream as the whole `params` and the rest of data on `meta.details`
				return context.ctx.call(method, data[0].stream, {
					...options,
					meta: { ...((options as any)?.meta || {}), details: data[0].details },
				});
			}
			return context.ctx.call(method, data, options);
		}

		const services: { name: string }[] = await this.broker.call('$node.services', {
			onlyAvailable: true,
		});

		if (!services.find((service) => service.name === method.split('.')[0])) {
			return new Error('method-not-available');
		}

		// We're assuming that if Data is an object containing an `stream` key, the intent is to pass an stream or to receive an stream.
		if (data?.[0]?.stream) {
			return this.broker.call(method, data[0].stream, {
				...options,
				meta: {
					optl: injectCurrentContext(),
					details: data?.[0]?.details,
				},
			});
		}
		return this.broker.call(method, data, {
			...options,
			meta: {
				optl: injectCurrentContext(),
			},
		});
	}

	async destroyService(instance: IServiceClass): Promise<void> {
		const name = instance.getName();
		if (!name) {
			return;
		}
		await this.broker.destroyService(name);
		instance.removeAllListeners();
	}

	createService(instance: IServiceClass, serviceDependencies: string[] = []): void {
		const methods = (
			instance.constructor?.name === 'Object'
				? Object.getOwnPropertyNames(instance)
				: Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
		).filter((name) => name !== 'constructor');

		const serviceInstance = instance as any;

		const name = instance.getName();
		if (!name) {
			return;
		}

		const instanceEvents = instance.getEvents();
		if (!instanceEvents && !methods.length) {
			return;
		}

		const dependencies = [...serviceDependencies, ...(name === 'settings' ? [] : this.defaultDependencies)].filter(
			(dependency) => dependency !== name,
		);

		const service: ServiceSchema = {
			name,
			actions: {},
			mixins: !instance.isInternal() ? [EnterpriseCheck] : [],
			...(dependencies.length ? { dependencies } : {}),
			events: instanceEvents.reduce<Record<string, (ctx: Context) => void>>((map, { eventName }) => {
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

			// TODO: better convention for these names
			if (method.includes('Stream')) {
				service.actions[method] = async (ctx: Context<[], { optl?: unknown; details?: unknown }>): Promise<any> => {
					return tracerSpan(
						`action ${name}:${method}:stream`,
						{},
						() => {
							return asyncLocalStorage.run(
								{
									id: ctx.id,
									nodeID: ctx.nodeID,
									requestID: ctx.requestID,
									broker: this,
									ctx,
								},
								// Moleculer expects the whole `ctx.params` to be the stream only, so we pass the stream there
								// and any extra information as `details` in the context meta.
								() => serviceInstance[method]({ stream: ctx.params, details: ctx.meta.details }),
							);
						},
						ctx.meta?.optl,
					);
				};
			} else {
				service.actions[method] = async (ctx: Context<[], { optl?: unknown }>): Promise<any> => {
					return tracerSpan(
						`action ${name}:${method}`,
						{},
						() => {
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
						},
						ctx.meta?.optl,
					);
				};
			}
		}

		this.broker.createService(service);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.broadcast(event, args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		void this.broker.broadcastLocal(event, args);
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void> {
		void this.broker.broadcast(event, args, services);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return this.broker.call('$node.list');
	}

	async start(): Promise<void> {
		await this.broker.start();

		this.started = Promise.resolve(true);
	}
}
