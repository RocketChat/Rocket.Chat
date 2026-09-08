const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

const hostPortPattern = /^[^\s:/?#]+\.[^\s:/?#]+:\d+(?:[/?#]|$)/;
const rootRelativePattern = /^\/(?![/\\])[^\s]*$/;

const parseUrl = (href: string): URL | undefined => {
	try {
		return new URL(href);
	} catch {
		return undefined;
	}
};

export const sanitizeUrl = (href: string): string | undefined => {
	if (!href) {
		return undefined;
	}

	if (rootRelativePattern.test(href)) {
		return href;
	}

	const absolute = parseUrl(href);

	if (absolute) {
		if (allowedProtocols.includes(absolute.protocol.toLowerCase())) {
			return absolute.href;
		}

		if (!hostPortPattern.test(href)) {
			return undefined;
		}
	}

	const url = parseUrl(href.startsWith('//') ? `https:${href}` : `https://${href}`);

	return url && allowedProtocols.includes(url.protocol.toLowerCase()) ? url.href : undefined;
};
