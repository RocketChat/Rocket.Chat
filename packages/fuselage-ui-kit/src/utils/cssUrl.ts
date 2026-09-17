/**
 * Renders a URL for a CSS `url()` value. The URL comes from message content,
 * so it is quoted and the characters that would end the quoted string or the
 * declaration are escaped. A URL that is not http(s) yields an empty value,
 * which leaves the element with its background colour.
 */
export const cssUrl = (url: string | undefined): string => {
	if (!url) {
		return 'none';
	}

	let parsed: URL;
	try {
		parsed = new URL(url, 'https://localhost');
	} catch {
		return 'none';
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		return 'none';
	}

	const escaped = parsed.href.replace(/[\\"]/g, '\\$&').replace(/[\n\r\f]/g, '');

	return `url("${escaped}")`;
};
