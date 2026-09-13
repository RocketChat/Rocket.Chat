/**
 * Wraps an initializer so it runs at most once, on first use, and concurrent
 * callers share the same attempt.
 *
 * A rejection is not remembered, so the next caller starts over. That is the
 * point: this exists for work that depends on another service, which may not be
 * reachable the first time it is asked.
 */
export const primeOnce = <T>(fn: () => Promise<T>): (() => Promise<T>) => {
	let pending: Promise<T> | undefined;

	return async (): Promise<T> => {
		if (!pending) {
			pending = fn();
			pending.catch(() => {
				pending = undefined;
			});
		}

		return pending;
	};
};
