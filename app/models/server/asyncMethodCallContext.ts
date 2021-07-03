import { AsyncLocalStorage } from 'async_hooks';

export type asyncMethodCallContextStoreItem = Set<{
	type: 'rest' | 'ddp' | 'model';
	userId?: string;
	method?: string;
	route?: string;
}>;

export const asyncMethodCallContextStore = new AsyncLocalStorage<asyncMethodCallContextStoreItem>();

export function traceInstanceMethods<T extends object>(instance: T, ignoreMethods: string[] = []): T {
	const className = instance.constructor.name;

	return new Proxy(instance, {
		get(target: Record<string, any>, prop: string): any {
			if (typeof target[prop] === 'function' && !ignoreMethods.includes(prop)) {
				return new Proxy(target[prop], {
					apply: (target, thisArg, argumentsList): any => {
						const store = asyncMethodCallContextStore.getStore();
						if (store) {
							store.add({ type: 'model', method: `${ className }.${ prop }` });
						}
						return Reflect.apply(target, thisArg, argumentsList);
					},
				});
			}

			return Reflect.get(target, prop);
		},
	}) as T;
}
