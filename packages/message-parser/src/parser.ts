import type { Inlines, Root } from './definitions';
import type { Options } from './index';
import { paragraph, plain, lineBreak, reducePlainTexts, inlineCode } from './utils';
import { Scanner } from './scanner';
import { isMarkupChar, isNewline, isPlainChar } from './chars';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);

export function parse(input: string, options: Options = {}): Root {
	const root: Root = [];
	const scanner = new Scanner(input);

	while (!scanner.isEnd()) {
		const start = scanner.save();

		// Scan to find if this line is empty
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
			// Re-scan the line properly through parseInline
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

export function parseInline(scanner: Scanner, _options: Options): Inlines[] {
	const nodes: Inlines[] = [];

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		const ch = scanner.char();

		// --- Escape sequences ---
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

		// --- Inline code ---
		if (ch === '`') {
			const result = parseInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				continue;
			}
		}

		// --- Plain run (bulk consume safe characters) ---
		if (isPlainChar(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isPlainChar(scanner.char())) {
				scanner.advance();
			}
			nodes.push(plain(scanner.sliceFrom(start)));
			continue;
		}

		// --- Fallback: consume one character as plain text ---
		nodes.push(plain(ch));
		scanner.advance();
	}

	return reducePlainTexts(nodes);
}

function parseInlineCode(scanner: Scanner): Inlines | null {
	const start = scanner.save();

	// consume opening backtick
	scanner.advance();

	const contentStart = scanner.save();

	// scan for closing backtick — no newlines allowed inside
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '`') {
		scanner.advance();
	}

	// must find a closing backtick with at least one char inside
	if (scanner.isEnd() || isNewline(scanner.char()) || scanner.char() !== '`') {
		scanner.restore(start);
		return null;
	}

	const content = scanner.sliceFrom(contentStart);

	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	// consume closing backtick
	scanner.advance();

	return inlineCode(plain(content));
}
