import { EventEmitter } from 'events';

import type { IBroker, IBrokerNode } from '../types/IBroker';
import type { ServiceClass } from '../types/ServiceClass';
import { asyncLocalStorage } from '..';
import type { EventSignatures } from './Events';
import { StreamerCentral } from '../../modules/streamer/streamer.module';

export class LocalBroker implements IBroker {
	private methods = new Map<string, (...params: any) => any>();

	private events = new EventEmitter();

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

	destroyService(instance: ServiceClass): void {
		const namespace = instance.getName();

		instance.getEvents().forEach((eventName) => {
			this.events.removeListener(eventName, instance.emit);
		});

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
	}

	createService(instance: ServiceClass): void {
		const namespace = instance.getName();

		instance.getEvents().forEach((eventName) => {
			this.events.on(eventName, (...args) => {
				instance.emit(eventName, ...(args as Parameters<EventSignatures[typeof eventName]>));
			});
		});

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

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.broadcastLocal(event, ...args);

		StreamerCentral.emit('broadcast', 'local', 'broadcast', [{ eventName: event, args }]);
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
		return [];
	}
}
