/**
 * Truncates a string to a specified maximum length, optionally adding ellipses.
 * @param str
 * @param maxLength
 * @param shouldAddEllipses
 * @return {string}
 */
export function truncateString(str: string, maxLength: number, shouldAddEllipses = true): string {
	const ellipsis = '...';
	if (str.length <= maxLength) {
		return str;
	}

	const suffix = shouldAddEllipses && maxLength > ellipsis.length ? ellipsis : '';
	let prefix = str.slice(0, maxLength - suffix.length);
	const lastCodeUnit = prefix.charCodeAt(prefix.length - 1);
	const nextCodeUnit = str.charCodeAt(prefix.length);
	if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff && nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
		prefix = prefix.slice(0, -1);
	}

	return prefix + suffix;
}
