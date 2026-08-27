export function isNewline(ch: string): boolean {
	return ch === '\n' || ch === '\r';
}

export function isSpace(ch: string): boolean {
	return ch === ' ' || ch === '\t';
}

export function isWhitespace(ch: string): boolean {
	return isSpace(ch) || isNewline(ch);
}

export function isDigit(ch: string): boolean {
	return ch >= '0' && ch <= '9';
}

export function isAlpha(ch: string): boolean {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

export function isAlphaNum(ch: string): boolean {
	return isAlpha(ch) || isDigit(ch);
}

export function isMarkupChar(ch: string): boolean {
	return '*_~`#@:|\\[!<$+()'.includes(ch);
}

export function isPlainChar(ch: string): boolean {
	return ch !== '' && !isNewline(ch) && !isMarkupChar(ch) && !isSpace(ch);
}

export function isUrlStart(ch: string): boolean {
	return isAlpha(ch) || isDigit(ch);
}

export function isEmailStart(ch: string): boolean {
	return isUrlStart(ch) || ch.charCodeAt(0) > 127;
}

export function isEmojiStart(ch: string): boolean {
	const code = ch.charCodeAt(0);
	return (
		code === 0xa9 ||
		code === 0xae ||
		code === 0x203c ||
		code === 0x2049 ||
		code === 0x2122 ||
		code === 0x2139 ||
		(code >= 0x2194 && code <= 0x21aa) || // Arrows
		(code >= 0x231a && code <= 0x23fa) || // Misc Technical
		code === 0x24c2 ||
		(code >= 0x25aa && code <= 0x27bf) || // Geometric Shapes, Symbols, Dingbats
		(code >= 0x2934 && code <= 0x2b55) || // Supplemental Arrows
		code === 0x3030 ||
		code === 0x303d ||
		code === 0x3297 ||
		code === 0x3299 ||
		(code >= 0xd800 && code <= 0xdbff) || // High surrogates (U+10000+ emoji)
		ch === '#' || // keycap bases
		ch === '*' ||
		(ch >= '0' && ch <= '9')
	);
}

export function isHexDigit(ch: string): boolean {
	return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

// ─── Emoticon ──────────────────────────────────────────────────────────────
export const EMOTICONS: Record<string, string> = {
	':)': 'slight_smile',
	':-)': 'slight_smile',
	':(': 'frowning',
	':-(': 'frowning',
	'D:': 'fearful',
	':D': 'grinning',
	':-D': 'grinning',
	':P': 'stuck_out_tongue',
	':-P': 'stuck_out_tongue',
	':p': 'stuck_out_tongue',
	':-p': 'stuck_out_tongue',
	';)': 'wink',
	';-)': 'wink',
	':o': 'open_mouth',
	':-o': 'open_mouth',
	':O': 'open_mouth',
	':-O': 'open_mouth',
	':|': 'neutral_face',
	':-|': 'neutral_face',
	':/': 'confused',
	':-/': 'confused',
	':\\': 'confused',
	':-\\': 'confused',
	':*': 'kissing_heart',
	'-_-': 'expressionless',
};

// Sorted longest-first so e.g. ":-D" wins over ":D"
export const EMOTICON_KEYS = Object.keys(EMOTICONS).sort((a, b) => b.length - a.length);
