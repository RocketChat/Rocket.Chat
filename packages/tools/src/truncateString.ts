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

	const sliceToBoundary = (end: number): string => {
		const previousCodePoint = str.charCodeAt(end - 1);
		const nextCodePoint = str.charCodeAt(end);
		const splitsSurrogatePair =
			end > 0 &&
			end < str.length &&
			previousCodePoint >= 0xd800 &&
			previousCodePoint <= 0xdbff &&
			nextCodePoint >= 0xdc00 &&
			nextCodePoint <= 0xdfff;

		return str.slice(0, splitsSurrogatePair ? end - 1 : end);
	};

	if (shouldAddEllipses && str.length > maxLength) {
		if (maxLength <= ellipsis.length) {
			return sliceToBoundary(maxLength);
		}

		return `${sliceToBoundary(maxLength - ellipsis.length)}${ellipsis}`;
	}

	return sliceToBoundary(maxLength);
}
