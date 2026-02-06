import { Package } from './package-registry.ts';

interface IHookOptions {
	bindEnvironment?: boolean;
	wrapAsync?: boolean;
	exceptionHandler?: ((exception: unknown) => void) | string;
	debugPrintExceptions?: string;
}

export class Hook<T extends (...args: any[]) => any = (...args: any[]) => any> {
	nextCallbackId = 0;

	callbacks: Record<number, T> = Object.create(null);

	bindEnvironment = true;

	wrapAsync = true;

	exceptionHandler: ((exception: unknown) => void) | string | undefined;

	constructor(options: IHookOptions = {}) {
		if (options.bindEnvironment === false) {
			this.bindEnvironment = false;
		}

		if (options.wrapAsync === false) {
			this.wrapAsync = false;
		}

		if (options.exceptionHandler) {
			this.exceptionHandler = options.exceptionHandler;
		} else if (options.debugPrintExceptions) {
			if (typeof options.debugPrintExceptions !== 'string') {
				throw new Error('Hook option debugPrintExceptions should be a string');
			}
			this.exceptionHandler = options.debugPrintExceptions;
		}
	}

	register(callback: T): { callback: T; stop: () => void } {
		const id = this.nextCallbackId++;
		this.callbacks[id] = callback;

		return {
			callback,
			stop: () => {
				delete this.callbacks[id];
			},
		};
	}

	clear() {
		this.nextCallbackId = 0;
		this.callbacks = Object.create(null);
	}

	/**
	 * For each registered callback, call the passed iterator function with the callback.
	 *
	 * The iterator function can choose whether or not to call the
	 * callback.  (For example, it might not call the callback if the
	 * observed object has been closed or terminated).
	 * The iteration is stopped if the iterator function returns a falsy
	 * value or throws an exception.
	 *
	 * @param iterator
	 */
	forEach(iterator: (callback: T) => boolean | void | undefined) {
		const ids = Object.keys(this.callbacks);
		for (let i = 0; i < ids.length; ++i) {
			const id = Number(ids[i]);
			// check to see if the callback was removed during iteration
			if (Object.hasOwn(this.callbacks, id)) {
				const callback = this.callbacks[id];
				if (!iterator(callback)) {
					break;
				}
			}
		}
	}

	async forEachAsync(iterator: (callback: T) => Promise<boolean | void | undefined>): Promise<void> {
		const ids = Object.keys(this.callbacks);
		for (let i = 0; i < ids.length; ++i) {
			const id = Number(ids[i]);
			// check to see if the callback was removed during iteration
			if (Object.hasOwn(this.callbacks, id)) {
				const callback = this.callbacks[id];
				// eslint-disable-next-line no-await-in-loop
				if (!(await iterator(callback))) {
					break;
				}
			}
		}
	}

	/**
	 * @deprecated use forEach
	 * @param iterator
	 */
	each(iterator: (callback: T) => boolean | void | undefined) {
		return this.forEach(iterator);
	}
}

Package['callback-hook'] = {
	Hook,
};
