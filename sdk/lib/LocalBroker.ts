import { IBroker } from '../types/IBroker';
import { ServiceClass } from '../types/ServiceClass';

const delay = (ms: number): Promise<number> => new Promise((resolve) => setTimeout(resolve, ms));

export class LocalBroker implements IBroker {
	private methods = new Map<string, Function>();

	async call(method: string, data: any): Promise<any> {
		await delay(500);
		const result = this.methods.get(method)?.(...data);
		await delay(500);
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

			this.methods.set(`${ namespace }.${ method }`, i[method]);
		}
	}
}
