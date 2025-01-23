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

const INTERVAL = 1000;
const TIMEOUT = INTERVAL * 10;

export class LocalBroker implements IBroker {
	private started = false;

	private methods = new Map<string, (...params: any) => any>();

	private events = new EventEmitter();

	private services = new Map<string, ExtendedServiceClass>();

	private flattenedDependencies: Set<string> = new Set();

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

	/**
	 * Creates a service and adds it to the local broker. In case of the broker is already started, it will start the service automatically.
	 */
	createService(instance: IServiceClass, serviceDependencies: string[] = []): void {
		const namespace = instance.getName() ?? '';

		if (this.services.has(namespace)) {
			throw new Error(`Service ${namespace} already exists`);
		}

		const dependencies = [
			...serviceDependencies,
			...(namespace === 'settings' ? [] : this.defaultDependencies),
		].filter((dependency) => dependency !== namespace);

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

		const service = { instance, dependencies, isStarted: false };
		this.services.set(namespace, service);
		this.flattenDependencies(service);

		if (this.started) {
			void this.start();
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

	/**
	 * Flattens dependencies of a service and updates the flattenedDependencies set.
	 */
	private flattenDependencies(service: ExtendedServiceClass): void {
		if (service.dependencies.length === 0) {
			return;
		}

		this.flattenedDependencies.add(service.instance.getName() ?? '');

		// We're assuming that each service will only have one level of dependencies
		for (const dependency of service.dependencies) {
			this.flattenedDependencies.add(dependency);
		}
	}

	/**
	 * Gets all services that are in the flattenedDependencies set and enriches them with the service instance. In case of the service is not found, it will return the dependency name.
	 */
	private getFlattenedServices(): (ExtendedServiceClass | string)[] {
		return Array.from(this.flattenedDependencies).map((dependency: string) => this.services.get(dependency) ?? dependency);
	}

	private async startService(service: ExtendedServiceClass | string): Promise<void> {
		const serviceName = typeof service === 'string' ? service : service.instance.getName();

		if (typeof service === 'string') {
			logger.debug(`Service ${serviceName} is not in the services map. Bringing it back to queue`);
			return;
		}

		if (service?.isStarted) {
			logger.debug(`Service ${serviceName} already started`);
			return;
		}

		const pendingDependencies = service.dependencies.filter((e) => !this.services.has(e) || !this.services.get(e)?.isStarted);
		if (pendingDependencies.length > 0) {
			logger.debug(
				`Service ${service.instance.getName()} has dependencies that are not started yet, bringing it back to queue: ${pendingDependencies.join(', ')}`,
			);
			return;
		}

		await service.instance.started();
		this.services.set(service.instance.getName() ?? '', { ...service, isStarted: true });

		logger.debug(`Service ${service.instance.getName()} successfully started`);
	}

	async start(): Promise<void> {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const intervalId = setInterval(async () => {
				const elapsed = Date.now() - startTime;

				const services = this.getFlattenedServices();

				const availableServices = services.filter((s): s is ExtendedServiceClass => typeof s !== 'string' && s.isStarted);
				const allServicesReady = availableServices.length === this.flattenedDependencies.size;

				if (allServicesReady) {
					logger.debug(`All services available: ${availableServices.map((s) => s.instance.getName()).join(', ')}`);
					clearInterval(intervalId);
					return resolve();
				}

				if (elapsed > TIMEOUT) {
					clearInterval(intervalId);
					const unstartedServices = services
						.filter((s) => typeof s === 'string' || !s.isStarted)
						.map((s) => (typeof s === 'string' ? s : s.instance.getName()));
					logger.error(`Timeout while waiting for LocalBroker services: ${unstartedServices.join(', ')}`);
					return reject(new Error(`Timeout while waiting for LocalBroker services: ${unstartedServices.join(', ')}`));
				}

				const servicesToStart = services.filter((s): s is ExtendedServiceClass => typeof s !== 'string' && !s.isStarted);
				for (const service of servicesToStart) {
					void this.startService(service);
				}

				logger.debug(`Waiting for services... ${availableServices.length}/${this.flattenedDependencies.size} ready`);
			}, INTERVAL);
		});
	}
}
