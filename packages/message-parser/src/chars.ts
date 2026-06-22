import { Inlines } from './definitions';
import { Scanner } from './scanner';
import { emoticon } from './utils';

// Is this character a line ending?
export function isNewline(ch: string): boolean {
	return ch === '\n' || ch === '\r';
}

// Is this character inline whitespace (space or tab)?
export function isSpace(ch: string): boolean {
	return ch === ' ' || ch === '\t';
}

// Is this character whitespace of any kind?
export function isWhitespace(ch: string): boolean {
	return isSpace(ch) || isNewline(ch);
}

// Is this an ASCII digit?
export function isDigit(ch: string): boolean {
	return ch >= '0' && ch <= '9';
}

// Is this an ASCII letter?
export function isAlpha(ch: string): boolean {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

// Is this an ASCII alphanumeric character?
export function isAlphaNum(ch: string): boolean {
	return isAlpha(ch) || isDigit(ch);
}

// Is this a hex digit?
export function isHexDigit(ch: string): boolean {
	return isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

// Is this one of the markup trigger characters?
export function isMarkupChar(ch: string): boolean {
	return '*_~`#@:|\\[!<$+'.includes(ch);
}

// Is this a plain run character — safe to bulk-consume without checking rules?
export function isPlainChar(ch: string): boolean {
	return ch !== '' && !isNewline(ch) && !isMarkupChar(ch);
}

// Helper: does the string match a literal at position i?
export function matchesAt(input: string, i: number, literal: string): boolean {
	return input.startsWith(literal, i);
}

export function isUrlSchemeChar(ch: string): boolean {
	return isAlphaNum(ch) || ch === '+' || ch === '-' || ch === '.';
}

export function isDomainChar(ch: string): boolean {
	return isAlphaNum(ch) || ch === '-' || ch === '.';
}

export function isUrlBodyChar(ch: string): boolean {
	return ch !== '' && !isWhitespace(ch) && ch !== '"' && ch !== "'" && ch !== '<' && ch !== '>' && ch !== '`';
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

// Sorted longest-first so e.g. ":-D" wins over ":D", ">:-)" over ">:)".
export const EMOTICON_KEYS = Object.keys(EMOTICONS).sort((a, b) => b.length - a.length);

// Match (and consume) the longest emoticon at the cursor. No boundary checks.
export function matchEmoticon(scanner: Scanner): Inlines | null {
	for (const key of EMOTICON_KEYS) {
		if (scanner.matches(key)) {
			scanner.advance(key.length);
			return emoticon(key, EMOTICONS[key]);
		}
	}
	return null;
}
