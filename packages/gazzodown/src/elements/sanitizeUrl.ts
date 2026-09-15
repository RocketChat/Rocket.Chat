export const sanitizeUrl = (href: string) => {
	if (!href) {
		return '#';
	}

	const sanitizedHref = href.trim();

	if (!sanitizedHref) {
		return '#';
	}

	try {
		const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(sanitizedHref);

		if (hasProtocol) {
			const url = new URL(sanitizedHref);
			const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
			return dangerousProtocols.includes(url.protocol.toLowerCase()) ? '#' : url.href;
		}

		if (
			sanitizedHref.startsWith('/') ||
			sanitizedHref.startsWith('./') ||
			sanitizedHref.startsWith('../') ||
			sanitizedHref.startsWith('#') ||
			sanitizedHref.startsWith('?')
		) {
			return sanitizedHref;
		}

		return `//${sanitizedHref}`;
	} catch {
		return '#';
	}
};
