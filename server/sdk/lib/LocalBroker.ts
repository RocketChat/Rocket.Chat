import { IBroker, IBrokerNode } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';
import { asyncLocalStorage } from '..';
import { EventSignatures } from './Events';

export class LocalBroker implements IBroker {
	private methods = new Map<string, Function>();

	async call(method: string, data: any): Promise<any> {
		const result = await asyncLocalStorage.run({
			id: 'ctx.id',
			nodeID: 'ctx.nodeID',
			requestID: 'ctx.requestID',
			broker: this,
		}, (): any => this.methods.get(method)?.(...data));

		return result;
	}

	createService(instance: ServiceClass): void {
		const namespace = instance.getName();

		const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}
			const i = instance as any;

			this.methods.set(`${ namespace }.${ method }`, i[method].bind(i));
		}
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		// TODO:
		console.log('broadcast implementation missing', event, args);
		// return this.broker.broadcast(eventName, data);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return [];
	}
}
