import { API_COUNT_LIMIT_DEFAULT } from '@rocket.chat/ui-contexts';

/**
 * The page size to ask paginated endpoints for, handed over by the server as
 * `window.__API_COUNT_LIMIT__` (injected in `server/lib/ui-master/scripts.ts` from the
 * `API_Upper_Count_Limit` setting, which is not public and so cannot be read any other way).
 *
 * Falls back to {@link API_COUNT_LIMIT_DEFAULT} whenever the global is missing or unusable —
 * an older cached page, a test, a story. Asking for less than the cap is always honored, so
 * the fallback is safe in every direction; asking for more is not, which is the whole reason
 * the value is published here.
 *
 * It stays a *suggestion*: the server clamps `count` to its own limit, so a page can come back
 * smaller than requested. Whoever pages must advance by what the response actually carried.
 */
export const getApiCountLimit = (): number => {
	if (typeof window === 'undefined') return API_COUNT_LIMIT_DEFAULT;

	try {
		const value = window.__API_COUNT_LIMIT__;

		if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
			return API_COUNT_LIMIT_DEFAULT;
		}

		return value;
	} catch {
		return API_COUNT_LIMIT_DEFAULT;
	}
};
