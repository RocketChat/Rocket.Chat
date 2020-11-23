const toString = (object: unknown): string =>
	(object ? `${ object }` : '');

export const escapeRegExp = (input: string): string =>
	toString(input)
		.replace(/[-.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
