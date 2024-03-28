import { AsyncLocalStorage } from 'async_hooks';

interface IContextStore<T> {
	getStore(): T | undefined;
	run(store: T, callback: (...args: any) => void, ...args: any): void;
}

// This is the default implementation of the context store but there is a bug on Meteor 2.5 that prevents us from using it
export class AsyncContextStore<T> extends AsyncLocalStorage<T> implements IContextStore<T> {}

export class FibersContextStore<T extends object> implements IContextStore<T> {
	getStore(): T | undefined {
		// return Fiber.current as unknown as T;
		return undefined
	}

	run(store: T, callback: (...args: any) => void, ...args: any): void {
		const fiber = {} as Record<any, any>;
		for (const key in store) {
			if (store.hasOwnProperty(key)) {
				fiber[key] = store[key];
			}
		}

		callback(...args);
	}
}
