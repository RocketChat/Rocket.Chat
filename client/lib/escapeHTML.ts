const escapeChars = {
	'¢': 'cent',
	'£': 'pound',
	'¥': 'yen',
	'€': 'euro',
	'©': 'copy',
	'®': 'reg',
	'<': 'lt',
	'>': 'gt',
	'"': 'quot',
	'&': 'amp',
	'\'': '#39',
} as const;

const regex = new RegExp(`[${ Object.keys(escapeChars).join('') }]`, 'g');

const toString = (object: unknown): string =>
	(object ? `${ object }` : '');

const isEscapable = (char: string): char is keyof typeof escapeChars =>
	char in escapeChars;

const escapeChar = (char: string): string =>
	(isEscapable(char) ? `&${ escapeChars[char] };` : '');

export const escapeHTML = (str: string): string =>
	toString(str).replace(regex, escapeChar);
