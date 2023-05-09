import { AsyncLocalStorage } from 'async_hooks';

interface IContextStore<T> {
	getStore(): T | undefined;
	run(store: T, callback: (...args: any) => void, ...args: any): void;
}

// This is the default implementation of the context store but there is a bug on Meteor 2.5 that prevents us from using it
export class AsyncContextStore<T> extends AsyncLocalStorage<T> implements IContextStore<T> {}

export class FakeContextStore<T extends object> implements IContextStore<T> {
	getStore(): T | undefined {
		return {} as unknown as T;
	}

	run(_store: T, callback: (...args: any) => void, ...args: any): void {
		// eslint-disable-next-line new-cap
		return callback(...args);
	}
}
