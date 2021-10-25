export const replaceVariables = (
	str: string,
	replacer: (substring: string, key: string) => string,
): string =>
	str.replace(/\{ *([^\{\} ]+)[^\{\}]*\}/gmi, replacer);
