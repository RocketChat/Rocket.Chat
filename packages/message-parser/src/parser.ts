import type { Root, Inlines } from './definitions';
import type { Options } from './index';
import { paragraph, plain, lineBreak, reducePlainTexts, inlineCode, bold, italic, strike } from './utils';
import { Scanner } from './scanner';
import { isAlpha, isAlphaNum, isNewline, isPlainChar, isSpace } from './chars';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);

// ─── Re-entrancy guards (mirrors PeggyJS skip flags) ──────────────────────────

let skipBold = false;
let skipItalic = false;
let skipStrike = false;

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parse(input: string, options: Options = {}): Root {
	const root: Root = [];
	const scanner = new Scanner(input);

	while (!scanner.isEnd()) {
		const start = scanner.save();

		// Peek: is this line empty?
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.advance();
		}

		const text = scanner.sliceFrom(start);
		const isLastPosition = scanner.isEnd();

		if (text === '') {
			if (!isLastPosition) {
				root.push(lineBreak());
			}
		} else {
			// Re-scan properly through parseInline
			scanner.restore(start);
			const inlines = parseInline(scanner, options);
			if (inlines.length > 0) {
				root.push(paragraph(inlines));
			}
		}

		// Skip newline character(s)
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else {
				scanner.advance(1);
			}
		}
	}

	return root;
}

// ─── Inline parser ────────────────────────────────────────────────────────────

function parseInline(scanner: Scanner, options: Options): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		const ch = scanner.char();

		// Escape sequences
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.advance(2);
				prevChar = next;
				nodes.push(plain(next));
				continue;
			}
			nodes.push(plain('\\'));
			scanner.advance();
			prevChar = '\\';
			continue;
		}

		// Inline code
		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '`';
				continue;
			}
		}

		// Bold
		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '*';
				continue;
			}
		}

		// Italic — only if not preceded by alphanumeric
		if (ch === '_') {
			if (!isAlphaNum(prevChar)) {
				const result = tryItalic(scanner, options);
				if (result !== null) {
					nodes.push(result);
					prevChar = '_';
					continue;
				}
			}
		}

		// Strikethrough
		if (ch === '~') {
			const result = tryStrike(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '~';
				continue;
			}
		}

		// Plain run
		if (isPlainChar(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isPlainChar(scanner.char())) {
				scanner.advance();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// Fallback
		nodes.push(plain(ch));
		prevChar = ch;
		scanner.advance();
	}

	return reducePlainTexts(nodes);
}

// ─── Inner content parser (used inside bold, italic, strike) ──────────────────
// Parses inline content stopping at a given delimiter string.

function parseInlineContent(scanner: Scanner, options: Options, stopChar: string): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (stopChar && scanner.matches(stopChar)) break;

		const ch = scanner.char();

		// Escape sequences
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.advance(2);
				nodes.push(plain(next));
				prevChar = next;
				continue;
			}
			nodes.push(plain('\\'));
			scanner.advance();
			prevChar = '\\';
			continue;
		}

		// Inline code
		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '`';
				continue;
			}
		}

		// Bold
		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '*';
				continue;
			}
		}

		// Italic — only if not preceded by alphanumeric
		if (ch === '_') {
			if (!isAlphaNum(prevChar)) {
				const result = tryItalic(scanner, options);
				if (result !== null) {
					nodes.push(result);
					prevChar = '_';
					continue;
				}
			}
		}

		// Strikethrough
		if (ch === '~') {
			const result = tryStrike(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '~';
				continue;
			}
		}

		// Plain run
		if (isPlainChar(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isPlainChar(scanner.char()) && !scanner.matches(stopChar)) {
				scanner.advance();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// Fallback
		nodes.push(plain(ch));
		prevChar = ch;
		scanner.advance();
	}

	return nodes;
}

// ─── Bold ─────────────────────────────────────────────────────────────────────

function tryBold(scanner: Scanner, options: Options): Inlines | null {
	if (skipBold) return null;

	const start = scanner.save();

	// Triple asterisk: emit plain('*') and let next iteration handle '**'
	if (scanner.matches('***')) {
		scanner.advance(1);
		return plain('*');
	}

	const isDouble = scanner.matches('**');
	const delimiter = isDouble ? '**' : '*';

	scanner.advance(delimiter.length);

	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	skipBold = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipBold = false;

	if (!scanner.matches(delimiter)) {
		scanner.restore(start);
		return null;
	}

	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Whitespace-only content → plain fallback
	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);
	return bold(reducePlainTexts(content) as any);
}

// ─── Inline code ──────────────────────────────────────────────────────────────

function tryInlineCode(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	scanner.advance(); // consume opening '`'

	const contentStart = scanner.save();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '`') {
		scanner.advance();
	}

	if (scanner.isEnd() || isNewline(scanner.char()) || scanner.char() !== '`') {
		scanner.restore(start);
		return null;
	}

	const content = scanner.sliceFrom(contentStart);
	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(); // consume closing '`'
	return inlineCode(plain(content));
}

function tryItalic(scanner: Scanner, options: Options): Inlines | null {
	if (skipItalic) return null;

	const start = scanner.save();

	// Detect _ or __
	const isDouble = scanner.matches('__');
	const delimiter = isDouble ? '__' : '_';

	scanner.advance(delimiter.length);

	// Cannot start italic and immediately end/newline
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	skipItalic = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipItalic = false;

	// Closing delimiter missing
	if (!scanner.matches(delimiter)) {
		scanner.restore(start);
		return null;
	}

	// Empty italic like "__"
	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Ignore whitespace-only italic
	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');

	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	// "__hello__text" → plain text
	if (isDouble && isAlphaNum(scanner.charAt(delimiter.length))) {
		scanner.restore(start);
		return null;
	}

	// "_hello_text" → plain text
	if (!isDouble && isAlpha(scanner.charAt(delimiter.length))) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);

	return italic(reducePlainTexts(content) as any);
}

function tryStrike(scanner: Scanner, options: Options): Inlines | null {
	if (skipStrike) return null;

	const start = scanner.save();

	// Triple tilde: emit plain('~') and let next iteration handle '~~'
	if (scanner.matches('~~~')) {
		scanner.advance(1);
		return plain('~');
	}

	const isDouble = scanner.matches('~~');
	const delimiter = isDouble ? '~~' : '~';

	scanner.advance(delimiter.length);

	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	skipStrike = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipStrike = false;

	if (!scanner.matches(delimiter)) {
		scanner.restore(start);
		return null;
	}

	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Whitespace-only → plain fallback
	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);
	return strike(reducePlainTexts(content) as any);
}
