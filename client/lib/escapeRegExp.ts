export const escapeRegExp = (input: string): string => {
	if (typeof input !== 'string') {
		throw new TypeError('string expected');
	}

	return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
