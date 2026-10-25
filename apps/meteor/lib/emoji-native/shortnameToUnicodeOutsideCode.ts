import { shortnameToUnicode } from './shortnameToUnicode';

const CODE_OR_LINK = /(```[\s\S]*?```|`[^`\n]+`|[a-z][a-z0-9+.-]*:\/\/\S+)/i;

/**
 * Replaces emoji shortnames with native unicode emoji in plain text meant to be read as-is, such as notifications,
 * keeping code and links exactly as the sender wrote them.
 */
export const shortnameToUnicodeOutsideCode = (text: string): string =>
	text
		.split(CODE_OR_LINK)
		.map((part, index) => (index % 2 === 1 ? part : shortnameToUnicode(part)))
		.join('');
