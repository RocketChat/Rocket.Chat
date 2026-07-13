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

export const getBaseURI = (): string => {
	if (document.baseURI) {
		return document.baseURI;
	}

	// Should be exactly one tag:
	//   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
	const base = document.getElementsByTagName('base');

	// Return location from BASE tag.
	if (base.length > 0) {
		return base[0].href;
	}

	// Else use implementation of documentURI:
	//   http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-baseURI
	return document.URL;
};

export const isExternal = (href: string): boolean => href.indexOf(getBaseURI()) !== 0;
