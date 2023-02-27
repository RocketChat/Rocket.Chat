export type ResolveHandler<T> = (value: T | PromiseLike<T>) => void;
export type RejectHandler = (reason: unknown) => void;

class Deferred<T> {
	promise: Promise<T>;

	resolve!: ResolveHandler<T>;

	reject!: RejectHandler;

	constructor() {
		this.promise = new Promise((_resolve, _reject) => {
			this.resolve = _resolve;
			this.reject = _reject;
		});
	}

	get computedPromise(): Promise<T> {
		return this.promise;
	}

	get computedResolve(): ResolveHandler<T> {
		return this.resolve;
	}

	get computedReject(): RejectHandler {
		return this.reject;
	}
}

const createDeferredValue = <T>(): Deferred<T> => new Deferred();

export { createDeferredValue };
