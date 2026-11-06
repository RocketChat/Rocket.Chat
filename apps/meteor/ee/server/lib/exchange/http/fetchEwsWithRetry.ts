import { sleep } from '../../../../../lib/utils/sleep';
import { ExchangeError, isExchangeError } from '../errors';
import { logger } from '../logger';

/**
 * Retry policy for EWS, under the same bounds as Graph's. Exchange reports throttling inside the SOAP body as often as in the
 * status, so this retries the parsed call rather than the HTTP request.
 */

const MAX_RETRIES = 5;
const BACKOFF_BASE_MS = 1000;
const RETRY_BUDGET_MS = 90000;

export async function fetchEwsWithRetry<T>(send: () => Promise<T>, throttle: { until: number }): Promise<T> {
	const deadline = Date.now() + RETRY_BUDGET_MS;

	for (let attempt = 0; ; attempt++) {
		if (throttle.until > deadline) {
			throw new ExchangeError('rate-limited', 'Exchange is throttling the service account', {
				detail: `the back-off Exchange asked for does not fit the ${RETRY_BUDGET_MS / 1000}s retry budget`,
			});
		}

		const waitMs = throttle.until - Date.now();

		if (waitMs > 0) {
			await sleep(waitMs);
		}

		try {
			return await send();
		} catch (err) {
			if (!isExchangeError(err) || err.code !== 'rate-limited' || attempt >= MAX_RETRIES) {
				throw err;
			}

			const backOffMs = err.retryAfterMs ?? BACKOFF_BASE_MS * 2 ** attempt;
			throttle.until = Math.max(throttle.until, Date.now() + backOffMs);

			logger.warn({ msg: 'Exchange is throttling, backing off before retrying', backOffMs, attempt: attempt + 1 });
		}
	}
}
