import { EventEmitter } from 'events';

import { Logger } from '@rocket.chat/logger';
import { InstanceStatus } from '@rocket.chat/models';
import { injectCurrentContext, tracerActiveSpan } from '@rocket.chat/tracing';

import { asyncLocalStorage } from '.';
import type { EventSignatures } from './events/Events';
import type { IBroker, IBrokerNode } from './types/IBroker';
import type { ServiceClass, IServiceClass } from './types/ServiceClass';

type ExtendedServiceClass = { instance: IServiceClass; dependencies: string[]; isStarted: boolean };

const logger = new Logger('LocalBroker');

export class LocalBroker implements IBroker {
	private started = false;

	private methods = new Map<string, (...params: any) => any>();

	private events = new EventEmitter();

	private services = new Map<string, ExtendedServiceClass>();

	private defaultDependencies = ['settings'];

	async call(method: string, data: any): Promise<any> {
		return tracerActiveSpan(
			`action ${method}`,
			{},
			() => {
				return asyncLocalStorage.run(
					{
						id: 'ctx.id',
						nodeID: 'ctx.nodeID',
						requestID: 'ctx.requestID',
						broker: this,
					},
					(): any => this.methods.get(method)?.(...data),
				);
			},
			injectCurrentContext(),
		);
	}

	async destroyService(instance: ServiceClass): Promise<void> {
		const namespace = instance.getName();

		instance.getEvents().forEach((event) => event.listeners.forEach((listener) => this.events.removeListener(event.eventName, listener)));

		const methods =
			instance.constructor?.name === 'Object'
				? Object.getOwnPropertyNames(instance)
				: Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}

			this.methods.delete(`${namespace}.${method}`);
		}
		instance.removeAllListeners();
		await instance.stopped();
	}

	createService(instance: IServiceClass, serviceDependencies: string[] = []): void {
		const namespace = instance.getName() ?? '';
		const dependencies = [...serviceDependencies, ...this.defaultDependencies].filter((dependency) => dependency !== namespace);

		instance.created();

		instance.getEvents().forEach((event) => event.listeners.forEach((listener) => this.events.on(event.eventName, listener)));

		const methods =
			instance.constructor?.name === 'Object'
				? Object.getOwnPropertyNames(instance)
				: Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}
			const i = instance as any;
			this.methods.set(`${namespace}.${method}`, i[method].bind(i));
		}

		if (this.started) {
			void instance.started();
			this.services.set(namespace, { instance, dependencies, isStarted: true });
		} else {
			this.services.set(namespace, { instance, dependencies, isStarted: false });
		}
	}

	onBroadcast(callback: (eventName: string, args: unknown[]) => void): void {
		this.events.on('broadcast', callback);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.broadcastLocal(event, ...args);

		this.events.emit('broadcast', event, args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.events.emit(event, ...args);
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		_services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void> {
		this.events.emit(event, ...args);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		// TODO models should not be called form here. we should create an abstraction to an internal service to perform this query
		const instances = await InstanceStatus.find({}, { projection: { _id: 1 } }).toArray();

		return instances.map(({ _id }) => ({ id: _id, available: true }));
	}

	private async startService(service: ExtendedServiceClass): Promise<void> {
		if (service?.isStarted) {
			logger.debug(`Service ${service.instance.getName()} already started`);
			return;
		}

		for await (const dependency of service?.dependencies ?? []) {
			const dependencyService = this.services.get(dependency);
			if (!dependencyService) {
				throw new Error(`Dependency service ${dependency} not found`);
			}
			logger.debug(`Starting dependency ${dependency} from ${service.instance.getName()}`);
			await this.startService(dependencyService);
		}

		await service.instance.started();
		this.services.set(service.instance.getName() ?? '', { ...service, isStarted: true });
		logger.debug(`Service ${service.instance.getName()} started with ${service.dependencies.length} dependencies`);
	}

	async start(): Promise<void> {
		for await (const service of this.services.values()) {
			await this.startService(service);
		}

		logger.debug(`Started ${this.services.size} services`);
	}
}
