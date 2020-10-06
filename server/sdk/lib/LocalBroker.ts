import { IBroker, IBrokerNode } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';
import { asyncLocalStorage } from '..';
import { EventSignatures } from './Events';

export class LocalBroker implements IBroker {
	private methods = new Map<string, Function>();

	private events = new Map<string, Set<Function>>();

	async call(method: string, data: any): Promise<any> {
		const result = await asyncLocalStorage.run({
			id: 'ctx.id',
			nodeID: 'ctx.nodeID',
			requestID: 'ctx.requestID',
			broker: this,
		}, (): any => this.methods.get(method)?.(...data));

		return result;
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.call(method, data);
	}

	createService(instance: ServiceClass): void {
		const namespace = instance.getName();

		for (const [event, fn] of Object.entries(instance.getEvents())) {
			const fns = this.events.get(event) || new Set();
			fns.add(fn);
			this.events.set(event, fns);
		}

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
		const fns = this.events.get(event);
		if (fns) {
			fns.forEach((fn) => fn(...args));
		}
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return [];
	}
}
