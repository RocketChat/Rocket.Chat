const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

export const sanitizeUrl = (href: string): string | undefined => {
	if (!href) {
		return undefined;
	}

	try {
		const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href);
		const url = hasProtocol ? new URL(href) : new URL(`https://${href.replace(/^\/+/, '')}`);

		return allowedProtocols.includes(url.protocol.toLowerCase()) ? url.href : undefined;
	} catch {
		return undefined;
	}
};
