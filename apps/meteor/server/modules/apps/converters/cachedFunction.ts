export const cachedFunction = <F extends (...args: any[]) => any>(fn: F) => {
	const cache = new Map<string, unknown>();

	return ((...args) => {
		const cacheKey = JSON.stringify(args);

		if (cache.has(cacheKey)) {
			return cache.get(cacheKey) as ReturnType<F>;
		}

		const result = fn(...args);

		cache.set(cacheKey, result);

		return result;
	}) as F;
};
