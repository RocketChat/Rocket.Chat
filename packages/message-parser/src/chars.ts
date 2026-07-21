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

export function isEmojiStart(ch: string): boolean {
	const code = ch.charCodeAt(0);
	return (
		(code >= 0xd800 && code <= 0xdbff) || // high surrogate → astral-plane emoji
		(code >= 0x2300 && code <= 0x23ff) || // misc technical (⌚ ⏰)
		(code >= 0x2600 && code <= 0x26ff) || // misc symbols (⚽ ☀)
		(code >= 0x2700 && code <= 0x27bf) // dingbats (❤ ✂)
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
