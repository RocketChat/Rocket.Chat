export type MemoizableFunction<T, A, R> = (this: T, arg: A) => R;
export type MemoizedFunction<T, A, R> = (this: T, arg: A) => R;

export type Options = {
	maxAge: number;
};

const store = new WeakMap<MemoizableFunction<unknown, unknown, unknown>, () => void>();

export const memoize = <T, A, R>(fn: MemoizableFunction<T, A, R>, _options?: Options): MemoizedFunction<T, A, R> => {
	const cache = new Map<A, R>();
	const cacheTimers = new Map<A, ReturnType<typeof setTimeout>>();

	const memoized: MemoizedFunction<T, A, R> = function (this, arg) {
		const cleanUp = (): void => {
			cache.delete(arg);
			cacheTimers.delete(arg);
		};

		if (cache.has(arg)) {
			const oldTimer = cacheTimers.get(arg);
			if (oldTimer) {
				clearTimeout(oldTimer);
			}

			if (_options) {
				const timer = setTimeout(cleanUp, _options.maxAge);
				cacheTimers.set(arg, timer);
			}

			return cache.get(arg) as R;
		}

		const result = fn.call(this, arg);

		cache.set(arg, result);

		if (_options) {
			const timer = setTimeout(cleanUp, _options.maxAge);
			cacheTimers.set(arg, timer);
		}

		return result;
	};

	store.set(memoized as MemoizableFunction<unknown, unknown, unknown>, () => {
		cacheTimers.forEach((timer) => clearTimeout(timer));
		cacheTimers.clear();
		cache.clear();
	});

	return memoized;
};

export const clear = (fn: MemoizedFunction<unknown, unknown, unknown>): void => {
	store.get(fn)?.();
};
