import { AsyncLocalStorage } from 'async_hooks';

import Fiber from 'fibers';

interface IContextStore<T> {
	getStore(): T | undefined;
	run(store: T, callback: (...args: any) => void, ...args: any): void;
}

// This is the default implementation of the context store but there is a bug on Meteor 2.5 that prevents us from using it
export class AsyncContextStore<T> extends AsyncLocalStorage<T> implements IContextStore<T> {}

export class FibersContextStore<T extends object> implements IContextStore<T> {
	getStore(): T | undefined {
		return Fiber.current as unknown as T;
	}

	run(store: T, callback: (...args: any) => void, ...args: any): void {
		// eslint-disable-next-line new-cap
		return Fiber((...rest: any) => {
			const fiber = Fiber.current as Record<any, any>;
			for (const key in store) {
				if (store.hasOwnProperty(key)) {
					fiber[key] = store[key];
				}
			}

			Fiber.yield(callback(...rest));
		}).run(...args);
	}
}
