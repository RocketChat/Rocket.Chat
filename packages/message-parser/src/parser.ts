import type { Root, Inlines } from './definitions';
import type { Options } from './index';
import { paragraph, plain, lineBreak, reducePlainTexts, inlineCode, bold } from './utils';
import { Scanner } from './scanner';
import { isNewline, isPlainChar, isSpace } from './chars';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);

// ─── Re-entrancy guards (skip flags) ──────────────────────────

let skipBold = false;

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

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		const ch = scanner.char();

		// Escape sequences
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.advance(2);
				nodes.push(plain(next));
				continue;
			}
			nodes.push(plain('\\'));
			scanner.advance();
			continue;
		}

		// Inline code
		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				continue;
			}
		}

		// Bold
		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				continue;
			}
		}

		// Plain run — bulk consume safe characters
		if (isPlainChar(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isPlainChar(scanner.char())) {
				scanner.advance();
			}
			nodes.push(plain(scanner.sliceFrom(start)));
			continue;
		}

		// Fallback: emit character as plain text
		nodes.push(plain(ch));
		scanner.advance();
	}

	return reducePlainTexts(nodes);
}

// ─── Inner content parser (used inside bold, italic, strike) ──────────────────
// Parses inline content stopping at a given delimiter string.

function parseInlineContent(scanner: Scanner, options: Options, stopChar: string): Inlines[] {
	const nodes: Inlines[] = [];

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (stopChar && scanner.matches(stopChar)) break;

		const ch = scanner.char();

		// Escape sequences
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.advance(2);
				nodes.push(plain(next));
				continue;
			}
			nodes.push(plain('\\'));
			scanner.advance();
			continue;
		}

		// Inline code
		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				continue;
			}
		}

		// Bold (re-entrancy guarded inside tryBold)
		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				continue;
			}
		}

		// Plain run
		if (isPlainChar(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isPlainChar(scanner.char()) && !scanner.matches(stopChar)) {
				scanner.advance();
			}
			nodes.push(plain(scanner.sliceFrom(start)));
			continue;
		}

		// Fallback
		nodes.push(plain(ch));
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
