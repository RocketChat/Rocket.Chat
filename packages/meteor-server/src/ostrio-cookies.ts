/**
 * Minimal port of the meteor/ostrio:cookies server surface Rocket.Chat uses:
 * `new Cookies()` followed by `cookies.get(name, cookieHeader)`.
 */
export class Cookies {
	/** Parse `name` out of a Cookie header string. */
	get(name: string, cookieHeader?: string): string | undefined {
		if (!cookieHeader) {
			return undefined;
		}

		for (const pair of cookieHeader.split(';')) {
			const index = pair.indexOf('=');
			if (index === -1) {
				continue;
			}
			const key = pair.slice(0, index).trim();
			if (key === name) {
				const value = pair.slice(index + 1).trim();
				try {
					return decodeURIComponent(value);
				} catch {
					return value;
				}
			}
		}

		return undefined;
	}
}
