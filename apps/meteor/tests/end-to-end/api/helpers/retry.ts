/* eslint-disable no-await-in-loop */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Retry a given function N times until it succeeds.
 * It should not be as workaround for eventual consistency, but in cases api calls have to be retried because of async tasks, it must be intentionally used.
 *
 * @param {Function} fn - Function that performs the assert/check.
 * @param {number} retries - Number of retries.
 * @param {number} delayMs - Delay between retries (ms).
 */
export async function retry(_description: string, fn: () => Promise<void> | void, options: { retries?: number; delayMs?: number } = {}) {
	const { retries = 3, delayMs = 10 } = options;
	let lastError;

	await delay(delayMs);
	for (let i = 0; i <= retries; i++) {
		try {
			const result = fn();
			if (result instanceof Promise) {
				await result;
			}
			return;
		} catch (err) {
			lastError = err;
			if (i < retries && delayMs > 0) {
				await delay(delayMs);
			}
		}
	}

	throw lastError;
}
