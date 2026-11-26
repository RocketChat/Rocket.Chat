import type { ExtendedFetchOptions, Response } from '@rocket.chat/server-fetch';
import { serverFetch } from '@rocket.chat/server-fetch';

import { sleep } from '../../../../../lib/utils/sleep';
import { ExchangeError } from '../errors';
import { logger } from '../logger';
import { scrubForLog } from '../scrub';

/**
 * Retry policy for Microsoft Graph
 *
 * - `Retry-After` is honoured wherever it appears, 429 or 5xx alike, which is Microsoft's documented rule:
 *   back off by the header, and fall back to exponential backoff only when there is none.
 * - 4xx other than 429 returns immediately. A bad credential does not improve with waiting.
 * - A transport failure is retried, because that is the transient this policy exists for. A refusal by the
 *   allowlist is the exception: it is the air-gap invariant and must never be looped on.
 * - A total budget bounds the call. Waiting less than the server asked only prolongs the throttling, so a
 *   wait that does not fit ends the attempt rather than being shortened.
 */

const MAX_RETRIES = 5;
const DEFAULT_RETRY_AFTER_SECONDS = 60;
const BACKOFF_BASE_MS = 1000;
const RETRY_BUDGET_MS = 90000;
const SSRF_REJECTION = 'error-ssrf-validation-failed';

const parseRetryAfterSeconds = (header: string | null): number | undefined => {
	if (!header) {
		return undefined;
	}

	const seconds = Number.parseInt(header, 10);

	return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
};

const waitMsFor = (response: Response, attempt: number): number => {
	const retryAfter = parseRetryAfterSeconds(response.headers.get('retry-after'));

	if (retryAfter !== undefined) {
		return retryAfter * 1000;
	}

	return response.status === 429 ? DEFAULT_RETRY_AFTER_SECONDS * 1000 : BACKOFF_BASE_MS * 2 ** attempt;
};

export async function fetchWithRetry(
	url: string,
	options: ExtendedFetchOptions,
	{ maxRetries = MAX_RETRIES, budgetMs = RETRY_BUDGET_MS }: { maxRetries?: number; budgetMs?: number } = {},
): Promise<Response> {
	const deadline = Date.now() + budgetMs;
	let lastResponse: Response | undefined;
	let lastError: unknown;
	let outOfBudget = false;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		let response: Response | undefined;

		try {
			response = await serverFetch(url, options);
			lastError = undefined;
		} catch (err) {
			if (err instanceof Error && err.message === SSRF_REJECTION) {
				logger.warn({ msg: 'Exchange request refused by the allowlist', err: scrubForLog(err) });

				throw new ExchangeError('host-not-allowed', 'The request targeted a host outside the allowlist', { detail: err.message });
			}

			lastError = err;
		}

		if (response) {
			if (response.ok) {
				return response;
			}

			lastResponse = response;

			if (response.status !== 429 && !(response.status >= 500 && response.status < 600)) {
				return response;
			}
		}

		if (attempt === maxRetries) {
			break;
		}

		const waitMs = response ? waitMsFor(response, attempt) : BACKOFF_BASE_MS * 2 ** attempt;

		if (Date.now() + waitMs > deadline) {
			outOfBudget = true;
			break;
		}

		logger.warn({ msg: 'Retrying Exchange request', status: response?.status, attempt: attempt + 1, maxRetries, waitMs });

		await sleep(waitMs);
	}

	if (lastError) {
		logger.warn({ msg: 'Exchange request failed', err: scrubForLog(lastError) });

		throw new ExchangeError('connection-failed', 'Could not reach the Exchange endpoint', {
			detail: lastError instanceof Error ? lastError.message : undefined,
		});
	}

	if (lastResponse?.status === 429) {
		throw new ExchangeError('rate-limited', 'Exchange rate limit exceeded and retries exhausted', {
			detail: outOfBudget
				? `the wait the server asked for does not fit the ${Math.round(budgetMs / 1000)}s retry budget`
				: `gave up after ${maxRetries} retries`,
		});
	}

	return lastResponse as Response;
}
