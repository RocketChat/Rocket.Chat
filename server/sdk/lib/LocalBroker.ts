import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';

export class LocalBroker implements IBroker {
	private methods = new Map<string, Function>();

	async call(method: string, data: any): Promise<any> {
		const result = this.methods.get(method)?.(...data);
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
}
