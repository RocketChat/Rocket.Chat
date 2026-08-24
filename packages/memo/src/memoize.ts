export type MemoizableFunction<T, A, R> = (this: T, arg: A) => R;
export type MemoizedFunction<T, A, R> = (this: T, arg: A) => R;

export type Options = {
	maxAge: number;
};

const store = new WeakMap<MemoizableFunction<unknown, unknown, unknown>, Map<unknown, unknown>>();

const isCachedValue = <A, R>(cachedValue: R | undefined, arg: A, cache: Map<A, R>): cachedValue is R =>
	cache.has(arg) && cache.get(arg) === cachedValue;

export const memoize = <T, A, R>(fn: MemoizableFunction<T, A, R>, _options?: Options): MemoizedFunction<T, A, R> => {
	const cache = new Map<A, R>();
	const cacheTimers = new Map<A, ReturnType<typeof setTimeout>>();

	const memoized: MemoizedFunction<T, A, R> = function (this, arg) {
		const cleanUp = (): void => {
			cache.delete(arg);
			cacheTimers.delete(arg);
		};

		const cachedValue = cache.get(arg);

		if (isCachedValue(cachedValue, arg, cache)) {
			const oldTimer = cacheTimers.get(arg);
			if (oldTimer) {
				clearTimeout(oldTimer);
			}

			if (_options) {
				const timer = setTimeout(cleanUp, _options.maxAge);
				cacheTimers.set(arg, timer);
			}

			return cachedValue;
		}

		const result = fn.call(this, arg);

		cache.set(arg, result);

		if (_options) {
			const timer = setTimeout(cleanUp, _options.maxAge);
			cacheTimers.set(arg, timer);
		}

		return result;
	};

	store.set(memoized as MemoizableFunction<unknown, unknown, unknown>, cache);

	return memoized;
};

export const clear = (fn: MemoizedFunction<unknown, unknown, unknown>): void => {
	const cache = store.get(fn);
	cache?.clear();
};
