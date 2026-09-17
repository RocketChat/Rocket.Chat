/**
 * Renders a URL for a CSS `url()` value. The URL comes from message content,
 * so it is quoted and the characters that would end the quoted string or the
 * declaration are escaped. A URL that carries a scheme the browser must not
 * fetch yields an empty value, which leaves the element with its background
 * colour.
 */
export const cssUrl = (url: string | undefined): string => {
	const value = url?.trim();

	if (!value) {
		return 'none';
	}

	// A value without a scheme is relative and the browser resolves it against
	// the document, which is how the image URL was used before and how the
	// `img` element of an image block still uses it. Only a value that brings
	// its own scheme can point somewhere else, and then it has to be http(s).
	if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
		let parsed: URL;

		try {
			parsed = new URL(value);
		} catch {
			return 'none';
		}

		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return 'none';
		}
	}

	const escaped = value.replace(/[\\"]/g, '\\$&').replace(/[\n\r\f]/g, '');

	return `url("${escaped}")`;
};
