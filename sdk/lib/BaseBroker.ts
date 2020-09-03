export abstract class BaseBroker {
	protected log(...args: Array<any>): void {
		console.log('BROKER:', ...args);
	}

	abstract register(name: string, method: Function): void;

	registerInstance(instance: object): void {
		const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}
			const i = instance as any;
			this.register(method, i[method]);
		}
	}

	abstract async call(method: string, data: any): Promise<any>;
}
