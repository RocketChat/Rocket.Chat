const characterToHtmlEntityCode = {
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

const regex = new RegExp(`[${ Object.keys(characterToHtmlEntityCode).join('') }]`, 'g');

const toString = (object: unknown): string =>
	(object ? `${ object }` : '');

const isEscapable = (char: string): char is keyof typeof characterToHtmlEntityCode =>
	char in characterToHtmlEntityCode;

const escapeChar = (char: string): string =>
	(isEscapable(char) ? `&${ characterToHtmlEntityCode[char] };` : '');

export const escapeHTML = (str: string): string =>
	toString(str).replace(regex, escapeChar);
