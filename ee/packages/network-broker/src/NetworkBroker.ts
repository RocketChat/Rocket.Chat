import { asyncLocalStorage } from '@rocket.chat/core-services';
import type { IBroker, IBrokerNode, IServiceMetrics, IServiceClass, EventSignatures } from '@rocket.chat/core-services';
import { trace, context as traceContext, propagation } from '@rocket.chat/tracing';
import type { ServiceBroker, Context, ServiceSchema } from 'moleculer';

import { EnterpriseCheck } from './EnterpriseCheck';

interface Carrier {
	traceparent?: string;
	tracestate?: string;
}

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

	private started: Promise<boolean> = Promise.resolve(false);

	metrics: IServiceMetrics;

	constructor(broker: ServiceBroker) {
		this.broker = broker;

		this.metrics = broker.metrics;
	}

	async call(method: string, data: any): Promise<any> {
		if (!(await this.started)) {
			return;
		}

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

		const currentSpan = trace.getSpan(traceContext.active());

		const output: Carrier = {};

		propagation.inject(traceContext.active(), output);

		console.log({ method, output, currentSpan });

		return this.broker.call(method, data, {
			requestID: currentSpan?.spanContext().traceId,
			meta: {
				optl: output,
			},
		});
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		if (!(await this.started)) {
			return;
		}

		try {
			await this.broker.waitForServices(method.split('.')[0], waitForServicesTimeout);
		} catch (err) {
			console.error(err);
			throw new Error('Dependent services not available');
		}

		const context = asyncLocalStorage.getStore();
		if (context?.ctx?.call) {
			return context.ctx.call(method, data);
		}

		const currentSpan = trace.getSpan(traceContext.active());

		const output: Carrier = {};

		propagation.inject(traceContext.active(), output);

		console.log({ method, output, currentSpan });

		return this.broker.call(method, data, {
			requestID: currentSpan?.spanContext().traceId,
			meta: {
				optl: output,
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

	createService(instance: IServiceClass, serviceDependencies?: string[]): void {
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

		// Allow services to depend on other services too
		const dependencies = name !== 'license' ? { dependencies: ['license', ...(serviceDependencies || [])] } : {};
		const service: ServiceSchema = {
			name,
			actions: {},
			mixins: !instance.isInternal() ? [EnterpriseCheck] : [],
			...dependencies,
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

		const tracer = trace.getTracer(`service: ${name}`);

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

			service.actions[method] = async (ctx: Context<[], { optl?: Carrier }>): Promise<any> => {
				if (ctx.meta?.optl) {
					const activeContext = propagation.extract(traceContext.active(), ctx.meta.optl);

					console.log(`action ${method}`, ctx.meta.optl);
					const span = tracer.startSpan(`action ${name}:${method}`, {}, activeContext);

					const result = await traceContext.with(trace.setSpan(activeContext, span), async () => {
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
					});

					span.end();

					return result;
				}

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
