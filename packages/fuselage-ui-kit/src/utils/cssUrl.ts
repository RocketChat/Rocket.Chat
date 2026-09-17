/**
 * Renders a URL for a CSS `url()` value. The URL comes from message content,
 * so it is quoted and the characters that would end the quoted string are
 * escaped. A URL that resolves to a scheme the browser must not fetch yields
 * an empty value, which leaves the element with its background colour.
 */
export const cssUrl = (url: string | undefined): string => {
	// Dropped first, before anything looks at the value: these are the
	// characters the URL parser removes on its own or that may not appear in a
	// CSS string, so removing them here is what keeps the value that is
	// checked and the value that is rendered the same one. A scheme split by
	// one of them cannot come back together after the check.
	const value = url?.replace(/[\t\n\r\f]/g, '').trim();

	if (!value) {
		return 'none';
	}

	// The base only lets a relative value parse. A relative value is rendered
	// as it was given, so it keeps resolving against the document, the way the
	// `img` element of an image block still resolves it.
	let parsed: URL;

	try {
		parsed = new URL(value, 'https://relative.invalid/');
	} catch {
		return 'none';
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		return 'none';
	}

	return `url("${value.replace(/[\\"]/g, '\\$&')}")`;
};
