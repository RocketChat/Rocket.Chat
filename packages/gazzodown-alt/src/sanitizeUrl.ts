const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

const hostPortPattern = /^[^\s:/?#]+:\d+(?:[/?#]|$)/;
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

	const absolute = hostPortPattern.test(href) ? undefined : parseUrl(href);

	if (absolute) {
		return allowedProtocols.includes(absolute.protocol.toLowerCase()) ? absolute.href : undefined;
	}

	const url = parseUrl(href.startsWith('//') ? `https:${href}` : `https://${href}`);

	return url && allowedProtocols.includes(url.protocol.toLowerCase()) ? url.href : undefined;
};
