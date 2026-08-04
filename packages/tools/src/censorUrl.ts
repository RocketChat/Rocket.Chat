/**
 * Redacts sensitive information from a URL string.
 *
 * This function parses a URL and replaces potentially sensitive data with placeholder text.
 * It redacts the following URL components:
 * - Username in the authentication section
 * - Password in the authentication section
 * - Query parameters named: 'query', 'access_token'
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
	try {
		const parsedUrl = new URL(url);

		if (parsedUrl.username) {
			parsedUrl.username = '*Redacted*';
		}

		if (parsedUrl.password) {
			parsedUrl.password = '*Redacted*';
		}

		if (parsedUrl.searchParams.has('query')) {
			parsedUrl.searchParams.set('query', '*Redacted*');
		}

		if (parsedUrl.searchParams.has('access_token')) {
			parsedUrl.searchParams.set('access_token', '*Redacted*');
		}

		return parsedUrl.toString();
	} catch {
		return url.toString();
	}
}
