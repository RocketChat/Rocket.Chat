export const sanitizeUrl = (href: string) => {
	if (!href) {
		return '#';
	}

	try {
		const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href);

		if (hasProtocol) {
			const url = new URL(href);
			const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
			return dangerousProtocols.includes(url.protocol.toLowerCase()) ? '#' : url.href;
		}

		return `//${href}`;
	} catch {
		return '#';
	}
};
