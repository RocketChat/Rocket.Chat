import Stream from 'node:stream';

import { asyncLocalStorage, getInstanceMethods } from '@rocket.chat/core-services';
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

const hasCall = (ctx: unknown): ctx is Pick<Context, 'call'> =>
	typeof ctx === 'object' && ctx !== null && 'call' in ctx && typeof ctx.call === 'function';

const isCallable = (value: unknown): value is (...args: unknown[]) => unknown => typeof value === 'function';

const getMethod = (instance: IServiceClass, method: string) => {
	const value: unknown = Reflect.get(instance, method);
	if (!isCallable(value)) {
		throw new Error(`${method} is not a method of service ${instance.getName()}`);
	}
	return value.bind(instance);
};

export class MoleculerBroker implements IBroker {
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

		const stream = data?.[0]?.streamParam;
		const isStreamingCall = !!stream;

		if (hasCall(context?.ctx)) {
			return context.ctx.call(method, isStreamingCall ? stream : data, {
				...options,
				...(isStreamingCall && { meta: { ...((options as any)?.meta || {}), details: data[0].details } }),
			});
		}

		const services: { name: string }[] = await this.broker.call('$node.services', {
			onlyAvailable: true,
		});

		if (!services.find((service) => service.name === method.split('.')[0])) {
			return new Error('method-not-available');
		}

		return this.broker.call(method, isStreamingCall ? stream : data, {
			...options,
			meta: {
				optl: injectCurrentContext(),
				...(isStreamingCall && { details: data?.[0]?.details }),
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
		const methods = getInstanceMethods(instance);

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
				const handler: (...args: unknown[]) => void = getMethod(instance, method);
				service.events[events[method]] = handler;
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
						getMethod(instance, method),
					);
				};
				continue;
			}

			service.actions[method] = async (ctx: Context<[], { optl?: unknown; details?: unknown }>): Promise<any> => {
				const isStreamingCall = Stream.isReadable(ctx.params as any);
				const params = isStreamingCall ? [{ streamParam: ctx.params, details: ctx.meta?.details }] : ctx.params;

				return tracerSpan(
					`action ${name}:${method}${isStreamingCall ? ' (streaming)' : ''}`,
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
							() => getMethod(instance, method)(...params),
						);
					},
					ctx.meta?.optl,
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

	async emitToOne<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker.emit(event, args);
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
		try {
			// We have to set this before calling `.start` as some services might call another service (settings, likely) as part of
			// their `started` lifecycle method. `.call` bails out early (and silently) if `started` is false, returning undefined
			// which can affect the service startup.
			this.started = Promise.resolve(true);

			await this.broker.start();
		} catch (e) {
			this.started = Promise.resolve(false);
			throw e;
		}
	}
}
