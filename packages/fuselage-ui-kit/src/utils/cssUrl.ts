/**
 * Renders a URL for a CSS `url()` value. The URL comes from message content,
 * so it is quoted and the characters that would end the quoted string or the
 * declaration are escaped. A URL that resolves to a scheme the browser must
 * not fetch yields an empty value, which leaves the element with its
 * background colour.
 */
export const cssUrl = (url: string | undefined): string => {
	const value = url?.trim();

	if (!value) {
		return 'none';
	}

	// Validated with the URL parser the browser itself uses, so a value that
	// hides its scheme behind a tab or a line break is still read as that
	// scheme. The base only lets a relative value parse: what is rendered is
	// the value as it was given, so a relative URL keeps resolving against the
	// document, the way the `img` element of an image block still resolves it.
	let parsed: URL;

	try {
		parsed = new URL(value, 'https://relative.invalid/');
	} catch {
		return 'none';
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		return 'none';
	}

	const escaped = value.replace(/[\\"]/g, '\\$&').replace(/[\n\r\f]/g, '');

	return `url("${escaped}")`;
};
