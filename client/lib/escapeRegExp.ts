export const escapeRegExp = (input: string): string =>
	input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
