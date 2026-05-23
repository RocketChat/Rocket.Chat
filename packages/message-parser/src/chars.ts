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
