import Fiber from 'fibers';
// import { AsyncLocalStorage } from 'async_hooks';

// export class ContextStore<T> {
// 	store: AsyncLocalStorage<T>;

// 	constructor() {
// 		this.store = new AsyncLocalStorage<T>();
// 	}

// 	getStore(): T | undefined {
// 		return this.store.getStore();
// 	}

// 	run(store: T, callback: () => void, ...args: any): void {
// 		return this.store.run(store, callback, ...args);
// 	}
// }

export class ContextStore<T extends object> {
	// store: AsyncLocalStorage<T>;

	// constructor() {
	// 	this.store = new AsyncLocalStorage<T>();
	// }

	getStore(): T | undefined {
		return Fiber.current as unknown as T;
	}

	run(store: T, callback: (...args: any) => void, ...args: any): void {
		// eslint-disable-next-line new-cap
		return Fiber((...rest: any) => {
			const fiber = Fiber.current as Record<any, any>;
			// console.log('store ->', store);
			for (const key in store) {
				if (store.hasOwnProperty(key)) {
					// console.log('store ->', key, store[key]);
					fiber[key] = store[key];
				}
			}
			// Object.keys(store).forEach((key) => {
			// 	fiber[key] = store[key];
			// });

			Fiber.yield(callback(...rest));
		}).run(...args);
	}
}
