import type { ExtendedFetchOptions, Response } from '@rocket.chat/server-fetch';
import { serverFetch } from '@rocket.chat/server-fetch';

import { ExchangeError } from '../errors';
import { logger } from '../logger';
import { scrubForLog } from '../scrub';

/**
 * Retry policy for Microsoft Graph
 *
 * - 429: wait the `Retry-After` header, defaulting to 60 seconds.
 * - 5xx: exponential backoff.
 * - 4xx other than 429: return immediately. A bad credential does not improve with waiting.
 */

const MAX_RETRIES = 5;
const DEFAULT_RETRY_AFTER_SECONDS = 60;
const BACKOFF_BASE_MS = 1000;
export const MAX_RETRY_AFTER_SECONDS = 300;

type Sleep = (ms: number) => Promise<void>;

const defaultSleep: Sleep = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const parseRetryAfterSeconds = (header: string | null): number => {
	if (!header) {
		return DEFAULT_RETRY_AFTER_SECONDS;
	}

	const seconds = Number.parseInt(header, 10);
	if (!Number.isFinite(seconds) || seconds < 0) {
		return DEFAULT_RETRY_AFTER_SECONDS;
	}

	return Math.min(seconds, MAX_RETRY_AFTER_SECONDS);
};

/** `sleep` is injectable so tests do not spend real time waiting. */
export async function fetchWithRetry(
	url: string,
	options: ExtendedFetchOptions,
	{ sleep = defaultSleep, maxRetries = MAX_RETRIES }: { sleep?: Sleep; maxRetries?: number } = {},
): Promise<Response> {
	let lastResponse: Response | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		let response: Response;

		try {
			response = await serverFetch(url, options);
		} catch (err) {
			// Terminal on purpose: an allowlist rejection must never be retried in a loop.
			logger.warn({ msg: 'Exchange request failed', err: scrubForLog(err) });

			throw new ExchangeError('connection-failed', 'Could not reach the Exchange endpoint', {
				detail: err instanceof Error ? err.message : undefined,
			});
		}

		if (response.ok) {
			return response;
		}

		lastResponse = response;

		const isRateLimited = response.status === 429;
		const isServerError = response.status >= 500 && response.status < 600;

		if (!isRateLimited && !isServerError) {
			return response;
		}

		if (attempt === maxRetries) {
			break;
		}

		const waitMs = isRateLimited ? parseRetryAfterSeconds(response.headers.get('retry-after')) * 1000 : BACKOFF_BASE_MS * 2 ** attempt;

		logger.warn({
			msg: 'Retrying Exchange request',
			status: response.status,
			attempt: attempt + 1,
			maxRetries,
			waitMs,
		});

		await sleep(waitMs);
	}

	if (lastResponse?.status === 429) {
		throw new ExchangeError('rate-limited', 'Exchange rate limit exceeded and retries exhausted', {
			detail: `gave up after ${maxRetries} retries`,
		});
	}

	return lastResponse as Response;
}
