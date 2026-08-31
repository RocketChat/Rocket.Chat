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

	if (shouldAddEllipses && str.length > maxLength) {
		if (maxLength <= ellipsis.length) {
			return str.slice(0, maxLength);
		}

		return `${str.slice(0, maxLength - ellipsis.length)}${ellipsis}`;
	}

	return str.slice(0, maxLength);
}
