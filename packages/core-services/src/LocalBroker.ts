import { EventEmitter } from 'events';

import { InstanceStatus } from '@rocket.chat/models';

import type { IBroker, IBrokerNode } from './types/IBroker';
import type { ServiceClass, IServiceClass } from './types/ServiceClass';
import { asyncLocalStorage } from '.';
import type { EventSignatures } from './Events';

export class LocalBroker implements IBroker {
	private methods = new Map<string, (...params: any) => any>();

	private events = new EventEmitter();

	private services = new Set<IServiceClass>();

	async call(method: string, data: any): Promise<any> {
		const result = await asyncLocalStorage.run(
			{
				id: 'ctx.id',
				nodeID: 'ctx.nodeID',
				requestID: 'ctx.requestID',
				broker: this,
			},
			(): any => this.methods.get(method)?.(...data),
		);

		return result;
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.call(method, data);
	}

	async destroyService(instance: ServiceClass): Promise<void> {
		const namespace = instance.getName();

		// TODO: get only publicly available methods removing all private methods
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
		instance.stopped();
	}

	createService(instance: IServiceClass): void {
		const namespace = instance.getName();

		this.services.add(instance);

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

	async start(): Promise<void> {
		await Promise.all([...this.services].map((service) => service.started()));
	}
}
