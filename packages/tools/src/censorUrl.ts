const SENSITIVE_QUERY_PARAMS = new Set([
	'query',
	'access_token',
	'token',
	'auth_token',
	'authtoken',
	'secret',
	'password',
	'apikey',
	'api_key',
	'authorization',
	'code',
]);

const redactUrlParams = (parsedUrl: URL): void => {
	if (parsedUrl.username) {
		parsedUrl.username = '*Redacted*';
	}

	if (parsedUrl.password) {
		parsedUrl.password = '*Redacted*';
	}

	const keysToRedact: string[] = [];
	for (const key of parsedUrl.searchParams.keys()) {
		if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
			keysToRedact.push(key);
		}
	}

	for (const key of keysToRedact) {
		parsedUrl.searchParams.set(key, '*Redacted*');
	}
};

/**
 * Redacts sensitive information from a URL string.
 *
 * This function parses a URL and replaces potentially sensitive data with placeholder text.
 * It redacts the following URL components:
 * - Username in the authentication section
 * - Password in the authentication section
 * - Sensitive query parameters: 'query', 'access_token', 'token', 'auth_token', 'authtoken', 'secret', 'password', 'apikey', 'api_key', 'authorization', 'code'
 *
 * Note: We use `*Redacted*` instead of `[Redacted]` for legibility, as `[` and `]` would be encoded by toString()
 *
 * @param url - The URL string to be censored
 * @returns The URL string with sensitive information redacted, or the original URL if parsing fails
 *
 * @example
 * ```ts
 * censorUrl('https://user:password@example.com/path?query=secret&access_token=token');
 * // Returns: 'https://*Redacted*:*Redacted*@example.com/path?query=*Redacted*&access_token=*Redacted*'
 * ```
 */
export function censorUrl(url: string | URL): string {
	if (url instanceof URL) {
		const parsedUrl = new URL(url.toString());
		redactUrlParams(parsedUrl);
		return parsedUrl.toString();
	}

	if (typeof url !== 'string') {
		return String(url);
	}

	// 1. Protocol-relative URL: //user:pass@host/path?token=secret
	if (url.startsWith('//')) {
		try {
			const parsed = new URL(`http:${url}`);
			redactUrlParams(parsed);
			return parsed.toString().slice(5); // remove 'http:'
		} catch {
			return url;
		}
	}

	// 2. Absolute URL with scheme: https://user:pass@example.com/path?token=secret
	try {
		const parsedUrl = new URL(url);
		redactUrlParams(parsedUrl);
		return parsedUrl.toString();
	} catch {
		// 3. Relative URL (path-relative, dot-relative, root-relative, or query-only)
		try {
			const dummyBase = 'http://localhost';
			const parsed = new URL(url, dummyBase);
			redactUrlParams(parsed);

			const queryIndex = url.indexOf('?');
			const hashIndex = url.indexOf('#');
			const splitIndex =
				queryIndex !== -1 && hashIndex !== -1
					? Math.min(queryIndex, hashIndex)
					: queryIndex !== -1
						? queryIndex
						: hashIndex;

			if (splitIndex === -1) {
				return url;
			}

			const pathPrefix = url.slice(0, splitIndex);
			return pathPrefix + parsed.search + parsed.hash;
		} catch {
			return url;
		}
	}
}
