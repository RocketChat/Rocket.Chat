import { API_COUNT_LIMIT_DEFAULT } from '@rocket.chat/ui-contexts';

/**
 * The page size this workspace published, or {@link API_COUNT_LIMIT_DEFAULT} when the page carries
 * none — an older cached page, a test, a story. Asking for less than the workspace's cap is always
 * honored, so the fallback is safe in every direction.
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
