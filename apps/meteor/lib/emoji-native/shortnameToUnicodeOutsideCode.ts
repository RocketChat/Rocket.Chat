import { shortnameToUnicode } from './shortnameToUnicode';

const CODE_OR_LINK = /(?<!`)(`{3,})[\s\S]*?\1(?!`)|(?<!`)(`+)(?!`)[^\n]*?(?<!`)\2(?!`)|[a-z][a-z0-9+.-]*:\/\/\S+/gi;

/**
 * Replaces emoji shortnames with native unicode emoji in plain text meant to be read as-is, such as notifications,
 * keeping code and links exactly as the sender wrote them.
 */
export const shortnameToUnicodeOutsideCode = (text: string): string => {
	let result = '';
	let lastIndex = 0;

	for (const match of text.matchAll(CODE_OR_LINK)) {
		result += shortnameToUnicode(text.slice(lastIndex, match.index)) + match[0];
		lastIndex = match.index + match[0].length;
	}

	return result + shortnameToUnicode(text.slice(lastIndex));
};
