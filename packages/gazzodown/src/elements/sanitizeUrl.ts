export const sanitizeUrl = (href: string) => {
	try {
		const url = new URL(href);
		const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
		return dangerousProtocols.includes(url.protocol.toLowerCase()) ? '#' : url.href;
	} catch {
		return '#';
	}
};
