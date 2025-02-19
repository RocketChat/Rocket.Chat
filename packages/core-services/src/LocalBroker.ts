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

	private pendingServices: Set<string> = new Set();

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
		const serviceName = instance.getName();

		if (!serviceName || serviceName === '') {
			throw new Error('Service name cannot be empty');
		}

		if (this.services.has(serviceName)) {
			throw new Error(`Service ${serviceName} already exists`);
		}

		// TODO: find a better way to handle default dependencies and avoid loops
		const dependencies = [...serviceDependencies, ...(serviceName === 'settings' ? [] : this.defaultDependencies)].filter(
			(dependency) => dependency !== serviceName,
		);

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
			this.methods.set(`${serviceName}.${method}`, i[method].bind(i));
		}

		this.services.set(serviceName, { instance, dependencies, isStarted: false });
		this.registerPendingServices(Array.from(new Set([serviceName, ...dependencies])));

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
	 * Registers services to be started. We're assuming that each service will only have one level of dependencies.
	 */
	private registerPendingServices(services: string[] = []): void {
		for (const service of services) {
			this.pendingServices.add(service);
		}
	}

	/**
	 * Removes a service from the pending services set.
	 */
	private removePendingService(service: string): void {
		this.pendingServices.delete(service);
	}

	private async startService(service: ExtendedServiceClass): Promise<void> {
		const serviceName = service.instance.getName();

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
				`Service ${serviceName} has dependencies that are not started yet, bringing it back to queue: ${pendingDependencies.join(', ')}`,
			);
			return;
		}

		await service.instance.started();
		this.services.set(serviceName, { ...service, isStarted: true });
		this.removePendingService(serviceName);

		logger.debug(`Service ${serviceName} successfully started`);
	}

	async start(): Promise<void> {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const intervalId = setInterval(async () => {
				const elapsed = Date.now() - startTime;

				if (this.pendingServices.size === 0) {
					const availableServices = Array.from(this.services.values()).filter((service) => service.isStarted);

					logger.info(`All ${availableServices.length} services available`);
					clearInterval(intervalId);
					return resolve();
				}

				if (elapsed > TIMEOUT) {
					clearInterval(intervalId);
					const pendingServices = Array.from(this.pendingServices).join(', ');
					const error = new Error(`Timeout while waiting for LocalBroker services: ${pendingServices}`);
					logger.error(error);
					return reject(error);
				}

				for await (const service of Array.from(this.pendingServices)) {
					const serviceInstance = this.services.get(service);
					if (serviceInstance) {
						await this.startService(serviceInstance);
					}
				}

				logger.debug(`Waiting for ${this.pendingServices.size} pending services`);
			}, INTERVAL);
		});
	}
}
