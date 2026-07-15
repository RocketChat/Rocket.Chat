interface IHookOptions {
	bindEnvironment?: boolean;
	wrapAsync?: boolean;
	exceptionHandler?: ((exception: unknown) => void) | string;
	debugPrintExceptions?: string;
}

type Callback<TArgs extends any[] = unknown[], TResult = unknown> = (...args: TArgs) => TResult;

export class Hook<TArgs extends any[] = [], TResult = void, TCallback extends Callback<TArgs, TResult> = Callback<TArgs, TResult>> {
	nextCallbackId = 0;

	callbacks = new Map<number, TCallback>();

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

	register(callback: TCallback): { callback: TCallback; stop: () => void } {
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

	forEach(iterator: (callback: TCallback) => boolean | void | undefined) {
		for (const callback of this.callbacks.values()) {
			if (!iterator(callback)) {
				break;
			}
		}
	}

	async forEachAsync(iterator: (callback: TCallback) => Promise<boolean | void | undefined>): Promise<void> {
		for (const callback of this.callbacks.values()) {
			// eslint-disable-next-line no-await-in-loop
			if (!(await iterator(callback))) {
				break;
			}
		}
	}

	each(iterator: (callback: TCallback) => boolean | void | undefined) {
		return this.forEach(iterator);
	}
}
