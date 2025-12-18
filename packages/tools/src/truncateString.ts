export function truncateString(str: string, maxLength: number, shouldAddEllipses = true): string {
	const ellipsis = '...';

	if (shouldAddEllipses && str.length > maxLength) {
		return `${str.slice(0, maxLength - 3)}${ellipsis}`;
	}

	return str.slice(0, maxLength);
}
