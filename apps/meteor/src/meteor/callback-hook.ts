interface IHookOptions {
	bindEnvironment?: boolean;
	wrapAsync?: boolean;
	exceptionHandler?: ((exception: unknown) => void) | string;
	debugPrintExceptions?: string;
}

export class Hook<T extends (...args: any[]) => any = (...args: any[]) => any> {
	nextCallbackId = 0;

	// Optimization: Use Map instead of Object.
	// Maps allow O(1) addition/deletion without de-optimizing the object's hidden class.
	callbacks = new Map<number, T>();

	bindEnvironment = true;

	wrapAsync = true;

	exceptionHandler: ((exception: unknown) => void) | string | undefined;

	constructor(options: IHookOptions = {}) {
		const { bindEnvironment = true, wrapAsync = true, exceptionHandler, debugPrintExceptions } = options;

		this.bindEnvironment = bindEnvironment;
		this.wrapAsync = wrapAsync;

		if (exceptionHandler) {
			this.exceptionHandler = exceptionHandler;
		} else if (debugPrintExceptions) {
			if (typeof debugPrintExceptions !== 'string') {
				throw new Error('Hook option debugPrintExceptions should be a string');
			}
			this.exceptionHandler = debugPrintExceptions;
		}
	}

	register(callback: T): { callback: T; stop: () => void } {
		const id = this.nextCallbackId++;
		this.callbacks.set(id, callback);

		return {
			callback,
			stop: () => {
				this.callbacks.delete(id);
			},
		};
	}

	clear() {
		this.nextCallbackId = 0;
		this.callbacks.clear();
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
		// Optimization: Iterate directly over Map values.
		// Map iterators are live and handle deletions during iteration safely (the removed item is skipped).
		// This removes the need for `Object.keys` allocation and `Object.hasOwn` checks.
		for (const callback of this.callbacks.values()) {
			if (!iterator(callback)) {
				break;
			}
		}
	}

	async forEachAsync(iterator: (callback: T) => Promise<boolean | void | undefined>): Promise<void> {
		for (const callback of this.callbacks.values()) {
			// eslint-disable-next-line no-await-in-loop
			if (!(await iterator(callback))) {
				break;
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
