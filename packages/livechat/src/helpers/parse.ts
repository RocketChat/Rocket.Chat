import mem from 'mem';

const escapeMap: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'`': '&#x60;',
};

const escapeRegex = new RegExp(`(?:${Object.keys(escapeMap).join('|')})`, 'g');

const escapeHtml = mem((string: string) => string.replace(escapeRegex, (match) => escapeMap[match]));

export const parse = (plainText: string) => [{ plain: plainText }].map(({ plain }) => (plain ? escapeHtml(plain) : '')).join('');
