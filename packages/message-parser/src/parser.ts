import type { Root, Inlines } from './definitions';
import type { Options } from './index';
import {
	paragraph,
	plain,
	lineBreak,
	reducePlainTexts,
	inlineCode,
	bold,
	italic,
	strike,
	heading,
	mentionChannel,
	mentionUser,
	code,
	codeLine,
	quote,
	spoiler,
	spoilerBlock,
	link,
	unorderedList,
	listItem,
	orderedList,
	katex,
	inlineKatex,
	autoLink,
	bigEmoji,
	emoji,
	autoEmail,
	phoneChecker,
} from './utils';
import { Scanner } from './scanner';
import { isNewline, isPlainChar, isSpace, isAlpha, isAlphaNum, isDigit } from './chars';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);

function isShortCodeChar(ch: string): boolean {
	return isAlphaNum(ch) || ch === '-' || ch === '_' || ch === '+' || ch === '.';
}

// ─── Re-entrancy guards ───────────────────────────────────────────────────────

let skipBold = false;
let skipItalic = false;
let skipStrike = false;

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parse(input: string, options: Options = {}): Root {
	const bigEmojiRoot = tryBigEmoji(input);
	if (bigEmojiRoot !== null) {
		return bigEmojiRoot;
	}

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
			scanner.restore(start);

			const katexBlockNode: any = tryKatexBlock(scanner, options);
			if (katexBlockNode !== null) {
				root.push(katexBlockNode);
				continue;
			}

			// Try block-level rules first
			const codeFenceNode: any = tryCodeFence(scanner);
			if (codeFenceNode !== null) {
				root.push(codeFenceNode);
				continue;
			}

			const blockSpoilerNode: any = tryBlockSpoiler(scanner, options);
			if (blockSpoilerNode !== null) {
				root.push(blockSpoilerNode);
				continue;
			}

			const blockquoteNode: any = tryBlockquote(scanner, options);
			if (blockquoteNode !== null) {
				root.push(blockquoteNode);
				continue;
			}

			const unorderedListNode: any = tryUnorderedList(scanner, options);
			if (unorderedListNode !== null) {
				root.push(unorderedListNode);
				continue;
			}

			const orderedListNode: any = tryOrderedList(scanner, options);
			if (orderedListNode !== null) {
				root.push(orderedListNode);
				continue;
			}

			const headingNode: any = tryHeading(scanner, options);
			if (headingNode !== null) {
				root.push(headingNode);
			} else {
				const inlines = parseInline(scanner, options);
				if (inlines.length > 0) {
					root.push(paragraph(inlines));
				}
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

// ─── Block: Code Fence ────────────────────────────────────────────────────────

function tryCodeFence(scanner: Scanner): Root[number] | null {
	const start = scanner.save();
	const fence = '```';

	if (!scanner.matches(fence)) {
		return null;
	}
	scanner.advance(fence.length);

	// Optional language tag
	const langStart = scanner.save();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.advance();
	}
	const language = scanner.sliceFrom(langStart).trim();

	// Must be followed by newline
	if (scanner.isEnd()) {
		scanner.restore(start);
		return null;
	}

	// Consume newline after opening ```
	if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
		scanner.advance(2);
	} else {
		scanner.advance(1);
	}

	const lines: ReturnType<typeof codeLine>[] = [];

	while (!scanner.isEnd()) {
		// Check for closing ```
		if (scanner.matches(fence)) {
			scanner.advance(fence.length);
			// Consume any trailing content after closing ```
			while (!scanner.isEnd() && !isNewline(scanner.char())) {
				scanner.advance();
			}
			return code(lines, language || undefined);
		}

		// Collect line content
		const lineStart = scanner.save();
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.advance();
		}
		const lineText = scanner.sliceFrom(lineStart);
		lines.push(codeLine(plain(lineText)));

		// Consume newline
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else {
				scanner.advance(1);
			}
		}
	}

	// Never found closing ``` → backtrack
	scanner.restore(start);
	return null;
}

// ─── Block: Heading ───────────────────────────────────────────────────────────

function tryHeading(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	// Count # characters (max 4)
	let level = 0;
	while (level < 4 && scanner.char() === '#') {
		level++;
		scanner.advance();
	}

	if (level === 0) {
		scanner.restore(start);
		return null;
	}

	// Must be followed by at least one space or tab
	if (!isSpace(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	// Skip all spaces/tabs
	while (isSpace(scanner.char())) {
		scanner.advance();
	}

	// Must have content
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	const inlines = parseInline(scanner, options);
	return heading(inlines, level as 1 | 2 | 3 | 4);
}

// ─── Inline parser ────────────────────────────────────────────────────────────

function parseInline(scanner: Scanner, options: Options): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		const ch = scanner.char();

		// Whitespace run — kept as its own node so emoji boundary detection works
		if (isSpace(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isSpace(scanner.char())) {
				scanner.advance();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// KaTeX inline — $ or \(
		if (ch === '$' || (ch === '\\' && scanner.charAt(1) === '(')) {
			const result = tryKatexInline(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

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

		// Italic — only when not preceded by alphanumeric
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

		// Emoji shortcode
		if (ch === ':') {
			const result = tryEmojiShortCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ':';
				continue;
			}
		}

		// User mention
		if (ch === '@') {
			const result = tryUserMention(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '@';
				continue;
			}
		}

		// Channel mention — only when preceded by space or start
		if (ch === '#') {
			if (prevChar === '' || isSpace(prevChar)) {
				const result = tryChannelMention(scanner);
				if (result !== null) {
					nodes.push(result);
					prevChar = '#';
					continue;
				}
			}
		}

		// Markdown link
		if (ch === '[') {
			const result = tryMarkdownLink(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ']';
				continue;
			}
		}

		// Angle bracket link
		if (ch === '<') {
			const result = tryAngleBracketLink(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '>';
				continue;
			}
		}

		// Inline spoiler
		if (ch === '|') {
			const result = trySpoiler(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '|';
				continue;
			}
		}

		// Phone (+number) — only at a word boundary
		if (ch === '+' && (prevChar === '' || isSpace(prevChar))) {
			const result = tryPhone(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Email (local@domain) — before bare URL / autolink so it claims the @-region
		if (isAlpha(ch) || isDigit(ch) || ch.charCodeAt(0) > 127) {
			const result = tryEmail(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Bare URL (word.word style)
		if (isAlpha(ch)) {
			const result = tryBareUrl(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		// Auto-link URL — try when we see alpha chars that could be a domain/url
		if (isAlpha(ch) || isDigit(ch)) {
			const result = tryAutoLinkUrl(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Plain run — stop at '(' and ')' so dispatch can re-attempt email/URL after them
		if (isPlainChar(ch) && ch !== '(' && ch !== ')') {
			const start = scanner.save();
			while (
				!scanner.isEnd() &&
				isPlainChar(scanner.char()) &&
				!isSpace(scanner.char()) &&
				scanner.char() !== '(' &&
				scanner.char() !== ')'
			) {
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

// ─── Inner content parser ─────────────────────────────────────────────────────

function parseInlineContent(scanner: Scanner, options: Options, stopChar: string): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (stopChar && scanner.matches(stopChar)) break;

		const ch = scanner.char();

		// Whitespace run — kept as its own node so emoji boundary detection works
		if (isSpace(ch)) {
			const start = scanner.save();
			while (!scanner.isEnd() && isSpace(scanner.char()) && !scanner.matches(stopChar)) {
				scanner.advance();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// KaTeX inline — $ or \(
		if (ch === '$' || (ch === '\\' && scanner.charAt(1) === '(')) {
			const result = tryKatexInline(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

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

		// Italic
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

		// Emoji shortcode
		if (ch === ':') {
			const result = tryEmojiShortCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ':';
				continue;
			}
		}

		// User mention
		if (ch === '@') {
			const result = tryUserMention(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '@';
				continue;
			}
		}

		// Channel mention
		if (ch === '#') {
			if (prevChar === '' || isSpace(prevChar)) {
				const result = tryChannelMention(scanner);
				if (result !== null) {
					nodes.push(result);
					prevChar = '#';
					continue;
				}
			}
		}

		// Markdown link
		if (ch === '[') {
			const result = tryMarkdownLink(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ']';
				continue;
			}
		}

		// Angle bracket link
		if (ch === '<') {
			const result = tryAngleBracketLink(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '>';
				continue;
			}
		}

		// Inline spoiler
		if (ch === '|') {
			const result = trySpoiler(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '|';
				continue;
			}
		}

		// Phone (+number) — only at a word boundary
		if (ch === '+' && (prevChar === '' || isSpace(prevChar))) {
			const result = tryPhone(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Email (local@domain) — before bare URL / autolink so it claims the @-region
		if (isAlpha(ch) || isDigit(ch) || ch.charCodeAt(0) > 127) {
			const result = tryEmail(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Bare URL
		if (isAlpha(ch)) {
			const result = tryBareUrl(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		// Auto-link URL — try when we see alpha chars that could be a domain/url
		if (isAlpha(ch) || isDigit(ch)) {
			const result = tryAutoLinkUrl(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		// Plain run
		if (isPlainChar(ch) && ch !== '(' && ch !== ')') {
			const start = scanner.save();
			while (
				!scanner.isEnd() &&
				isPlainChar(scanner.char()) &&
				!isSpace(scanner.char()) &&
				!scanner.matches(stopChar) &&
				scanner.char() !== '(' &&
				scanner.char() !== ')'
			) {
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

	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);
	return bold(reducePlainTexts(content) as any);
}

// ─── Italic ───────────────────────────────────────────────────────────────────

function tryItalic(scanner: Scanner, options: Options): Inlines | null {
	if (skipItalic) return null;

	const start = scanner.save();

	if (scanner.matches('___')) {
		scanner.advance(1);
		return plain('_');
	}

	const isDouble = scanner.matches('__');
	const delimiter = isDouble ? '__' : '_';

	scanner.advance(delimiter.length);

	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	skipItalic = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipItalic = false;

	if (!scanner.matches(delimiter)) {
		scanner.restore(start);
		return null;
	}

	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	// Double underscore followed by alphanumeric → not italic
	if (isDouble && isAlphaNum(scanner.charAt(delimiter.length))) {
		scanner.restore(start);
		return null;
	}

	// Single underscore followed by alpha → not italic
	if (!isDouble && isAlpha(scanner.charAt(delimiter.length))) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);
	return italic(reducePlainTexts(content) as any);
}

// ─── Strikethrough ────────────────────────────────────────────────────────────

function tryStrike(scanner: Scanner, options: Options): Inlines | null {
	if (skipStrike) return null;

	const start = scanner.save();

	// Triple tilde: emit plain('~')
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

	const isWhitespaceOnly = content.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
	if (isWhitespaceOnly) {
		scanner.restore(start);
		return null;
	}

	scanner.advance(delimiter.length);
	return strike(reducePlainTexts(content) as any);
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

// ─── User mention ─────────────────────────────────────────────────────────────

function tryUserMention(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	scanner.advance(); // consume '@'

	const nameStart = scanner.save();

	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		const code = ch.charCodeAt(0);
		if (isAlphaNum(ch) || ch === '.' || ch === '-' || ch === '_' || ch === ':' || ch === '@' || code > 127) {
			scanner.advance();
		} else {
			break;
		}
	}

	const name = scanner.sliceFrom(nameStart);

	if (name.length === 0) {
		scanner.restore(start);
		return null;
	}

	if (name.endsWith('__')) {
		scanner.restore(start);
		return null;
	}

	return mentionUser(name);
}

// ─── Channel mention ──────────────────────────────────────────────────────────

function tryChannelMention(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	scanner.advance(); // consume '#'

	const nameStart = scanner.save();

	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		if (!isAlphaNum(ch) && ch !== '-' && ch !== '_' && ch !== '.') break;
		scanner.advance();
	}

	const name = scanner.sliceFrom(nameStart);

	if (name.length === 0) {
		scanner.restore(start);
		return null;
	}

	return mentionChannel(name);
}

function tryBlockquote(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	// Must start with '>'
	if (scanner.char() !== '>') {
		return null;
	}

	const paragraphs: ReturnType<typeof paragraph>[] = [];

	while (!scanner.isEnd() && scanner.char() === '>') {
		scanner.advance(); // consume '>'

		// Optional space/tab after '>'
		if (isSpace(scanner.char())) {
			scanner.advance();
		}

		// Empty line inside blockquote
		if (scanner.isEnd() || isNewline(scanner.char())) {
			paragraphs.push(paragraph([plain('')]));
		} else {
			// Parse the line content as inline
			const inlines = parseInline(scanner, options);
			paragraphs.push(paragraph(inlines));
		}

		// Consume newline
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else if (isNewline(scanner.char())) {
				scanner.advance(1);
			}
		}
	}

	if (paragraphs.length === 0) {
		scanner.restore(start);
		return null;
	}

	return quote(paragraphs);
}

function trySpoiler(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.save();

	// Must start with "||"
	if (!scanner.matches('||')) {
		return null;
	}
	scanner.advance(2); // consume opening "||"

	// Empty spoiler "||||" → plain
	if (scanner.matches('||')) {
		scanner.restore(start);
		return null;
	}

	// Parse content stopping at "||"
	const content = parseInlineContent(scanner, options, '||');

	// Must find closing "||"
	if (!scanner.matches('||')) {
		scanner.restore(start);
		return null;
	}
	scanner.advance(2); // consume closing "||"

	// Content must not be empty
	if (content.length === 0) {
		scanner.restore(start);
		return null;
	}

	return spoiler(reducePlainTexts(content) as any);
}

function tryBlockSpoiler(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	// Must be "||" followed immediately by newline
	if (!scanner.matches('||')) {
		return null;
	}

	// Check that "||" is alone on this line
	scanner.advance(2);
	if (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	// Consume the opening "||" line's newline
	if (!scanner.isEnd()) {
		if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
			scanner.advance(2);
		} else if (isNewline(scanner.char())) {
			scanner.advance(1);
		}
	} else {
		// "||" at end of input with no content → not a block spoiler
		scanner.restore(start);
		return null;
	}

	const paragraphs: ReturnType<typeof paragraph>[] = [];

	// Collect lines until closing "||"
	while (!scanner.isEnd()) {
		// Check for closing "||" on its own line
		if (scanner.matches('||')) {
			const closingPos = scanner.save();
			scanner.advance(2);
			// Must be end of line or end of input
			if (scanner.isEnd() || isNewline(scanner.char())) {
				if (paragraphs.length === 0) {
					scanner.restore(start);
					return null;
				}
				return spoilerBlock(paragraphs);
			}
			// Not a closing line → restore and treat as content
			scanner.restore(closingPos);
		}

		// Parse line as paragraph content
		const inlines = parseInline(scanner, options);
		paragraphs.push(paragraph(inlines));

		// Consume newline
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else if (isNewline(scanner.char())) {
				scanner.advance(1);
			}
		}
	}

	// Never found closing "||" → backtrack
	scanner.restore(start);
	return null;
}

function tryMarkdownLink(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.save();

	// Must start with '['
	if (scanner.char() !== '[') {
		return null;
	}
	scanner.advance(); // consume '['

	// Parse title content — stops at ']'
	const titleNodes = parseInlineContent(scanner, options, ']');

	// Must find ']('
	if (!scanner.matches('](')) {
		scanner.restore(start);
		return null;
	}
	scanner.advance(2); // consume ']('

	// Parse URL — stops at ')'
	const urlStart = scanner.save();
	let depth = 1;
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.char() === '(') depth++;
		if (scanner.char() === ')') {
			depth--;
			if (depth === 0) break;
		}
		scanner.advance();
	}

	if (!scanner.matches(')')) {
		scanner.restore(start);
		return null;
	}

	const url = scanner.sliceFrom(urlStart);
	scanner.advance(); // consume ')'

	if (url.length === 0) {
		scanner.restore(start);
		return null;
	}

	const title = reducePlainTexts(titleNodes);

	// Empty title → link with no label (defaults to src)
	if (title.length === 0) {
		return link(url);
	}

	return link(url, title as any);
}

function tryAngleBracketLink(scanner: Scanner): Inlines | null {
	const start = scanner.save();

	// Must start with '<'
	if (scanner.char() !== '<') {
		return null;
	}
	scanner.advance(); // consume '<'

	// Parse URL — stops at '|' or '>'
	const urlStart = scanner.save();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.char() === '|' || scanner.char() === '>') break;
		scanner.advance();
	}

	const url = scanner.sliceFrom(urlStart);

	if (url.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Must have '|' separator for angle bracket link
	if (scanner.char() !== '|') {
		scanner.restore(start);
		return null;
	}
	scanner.advance(); // consume '|'

	// Parse title — stops at '>'
	const titleStart = scanner.save();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '>') {
		scanner.advance();
	}

	if (scanner.char() !== '>') {
		scanner.restore(start);
		return null;
	}

	const title = scanner.sliceFrom(titleStart);
	scanner.advance(); // consume '>'

	return link(url, [plain(title)]);
}

// ─── Bare URL ─────────────────────────────────────────────────────────────────

function tryBareUrl(scanner: Scanner): Inlines | null {
	const start = scanner.save();

	// Collect leading word (alphanumeric + hyphen)
	if (!isAlpha(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	while (!scanner.isEnd() && (isAlphaNum(scanner.char()) || scanner.char() === '-')) {
		scanner.advance();
	}

	// Must hit a '.'
	if (scanner.isEnd() || scanner.char() !== '.') {
		scanner.restore(start);
		return null;
	}
	scanner.advance(); // consume '.'

	// Must have alphanumeric after '.'
	if (scanner.isEnd() || !isAlphaNum(scanner.char())) {
		scanner.restore(start);
		return null;
	}

	// Consume the rest of the URL-like token (no spaces/newlines)
	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		if (
			isAlphaNum(ch) ||
			ch === '.' ||
			ch === '-' ||
			ch === '_' ||
			ch === '/' ||
			ch === '?' ||
			ch === '#' ||
			ch === '=' ||
			ch === '&' ||
			ch === ':' ||
			ch === '@' ||
			ch === '!' ||
			ch === '+' ||
			ch === ',' ||
			ch === ';' ||
			ch === '~' ||
			ch === "'" ||
			ch === '(' ||
			ch === ')' ||
			ch === '*' ||
			ch === '$'
		) {
			scanner.advance();
		} else {
			break;
		}
	}

	const raw = scanner.sliceFrom(start);

	// Sanity check: must contain a dot not at start or end
	const dotIdx = raw.indexOf('.');
	if (dotIdx <= 0 || dotIdx === raw.length - 1) {
		scanner.restore(start);
		return null;
	}

	return link('//' + raw, [plain(raw)]);
}

function tryUnorderedList(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	// Detect which marker this list uses: '-' or '*'
	const marker = scanner.char();
	if (marker !== '-' && marker !== '*') {
		return null;
	}

	// Must be followed by space/tab
	if (!isSpace(scanner.charAt(1))) {
		return null;
	}

	const items: ReturnType<typeof listItem>[] = [];

	while (!scanner.isEnd()) {
		const ch = scanner.char();

		// Stop if marker changes or no longer a list item
		if (ch !== marker) break;
		if (!isSpace(scanner.charAt(1))) break;

		scanner.advance(); // consume marker

		// Skip spaces/tabs
		while (isSpace(scanner.char())) {
			scanner.advance();
		}

		// Parse item content as inline
		const inlines = parseInline(scanner, options);
		items.push(listItem(inlines));

		// Consume newline
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else if (isNewline(scanner.char())) {
				scanner.advance(1);
			}
		}
	}

	if (items.length === 0) {
		scanner.restore(start);
		return null;
	}

	return unorderedList(items);
}

function tryOrderedList(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	// Must start with a digit
	if (!isDigit(scanner.char())) {
		return null;
	}

	// Peek ahead to confirm pattern: digits + '.' + space
	const peekStart = scanner.save();
	while (!scanner.isEnd() && isDigit(scanner.char())) {
		scanner.advance();
	}
	if (scanner.char() !== '.') {
		scanner.restore(start);
		return null;
	}
	scanner.advance(); // consume '.'
	if (!isSpace(scanner.char())) {
		scanner.restore(start);
		return null;
	}
	scanner.restore(peekStart);

	const items: ReturnType<typeof listItem>[] = [];

	while (!scanner.isEnd()) {
		// Must start with digit
		if (!isDigit(scanner.char())) break;

		// Collect digits
		const numStart = scanner.save();
		while (!scanner.isEnd() && isDigit(scanner.char())) {
			scanner.advance();
		}
		const numStr = scanner.sliceFrom(numStart);

		// Must be followed by '.' then space
		if (scanner.char() !== '.') {
			scanner.restore(start);
			return null;
		}
		scanner.advance(); // consume '.'

		if (!isSpace(scanner.char())) {
			scanner.restore(start);
			return null;
		}

		// Skip spaces/tabs
		while (isSpace(scanner.char())) {
			scanner.advance();
		}

		// Parse item content
		const inlines = parseInline(scanner, options);
		items.push(listItem(inlines, parseInt(numStr, 10)));

		// Consume newline
		if (!scanner.isEnd()) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else if (isNewline(scanner.char())) {
				scanner.advance(1);
			}
		}
	}

	if (items.length === 0) {
		scanner.restore(start);
		return null;
	}

	return orderedList(items);
}

function tryKatexBlock(scanner: Scanner, options: Options): Root[number] | null {
	const start = scanner.save();

	let openDelim: string;
	let closeDelim: string;

	if (options.katex?.dollarSyntax && scanner.matches('$$')) {
		openDelim = '$$';
		closeDelim = '$$';
	} else if (options.katex?.parenthesisSyntax && scanner.matches('\\[')) {
		openDelim = '\\[';
		closeDelim = '\\]';
	} else {
		return null;
	}

	scanner.advance(openDelim.length);

	// Collect content until closing delimiter
	const contentStart = scanner.save();
	while (!scanner.isEnd()) {
		if (scanner.matches(closeDelim)) break;
		scanner.advance();
	}

	if (!scanner.matches(closeDelim)) {
		scanner.restore(start);
		return null;
	}

	const content = scanner.sliceFrom(contentStart);
	scanner.advance(closeDelim.length);

	return katex(content);
}

function tryKatexInline(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.save();

	let openDelim: string;
	let closeDelim: string;

	if (options.katex?.dollarSyntax && scanner.matches('$') && !scanner.matches('$$')) {
		openDelim = '$';
		closeDelim = '$';
	} else if (options.katex?.parenthesisSyntax && scanner.matches('\\(')) {
		openDelim = '\\(';
		closeDelim = '\\)';
	} else {
		return null;
	}

	scanner.advance(openDelim.length);

	const contentStart = scanner.save();

	// Inline katex: no newlines allowed inside
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.matches(closeDelim)) break;
		scanner.advance();
	}

	if (!scanner.matches(closeDelim)) {
		scanner.restore(start);
		return null;
	}

	const content = scanner.sliceFrom(contentStart);
	scanner.advance(closeDelim.length);

	return inlineKatex(content);
}

function tryAutoLinkUrl(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.save();

	// Collect the full URL token — everything until whitespace or end
	const tokenStart = scanner.save();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		scanner.advance();
	}

	const token = scanner.sliceFrom(tokenStart);
	if (token.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Must contain '://' or '.' to be worth trying
	if (!token.includes('://') && !token.includes('.')) {
		scanner.restore(start);
		return null;
	}

	// Strip trailing punctuation that shouldn't be part of URL
	// e.g. "rocket.chat." → "rocket.chat"
	let url = token;
	while (url.length > 0 && '.,!?;:)'.includes(url[url.length - 1])) {
		url = url.slice(0, -1);
	}

	if (url.length === 0) {
		scanner.restore(start);
		return null;
	}

	// Restore scanner to end of actual url (not trailing punct)
	scanner.restore(tokenStart);
	scanner.advance(url.length);

	// Use autoLink from utils which validates via tldts
	const result = autoLink(url, options.customDomains);

	// autoLink returns plain() if domain is invalid
	if (result.type === 'PLAIN_TEXT') {
		scanner.restore(start);
		return null;
	}

	return result;
}

// ─── Emoji ────────────────────────────────────────────────────────────────────

function tryEmojiShortCode(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	scanner.advance(); // consume opening ':'

	const nameStart = scanner.save();
	while (!scanner.isEnd() && isShortCodeChar(scanner.char())) {
		scanner.advance();
	}
	const name = scanner.sliceFrom(nameStart);

	if (name.length === 0 || scanner.char() !== ':') {
		scanner.restore(start);
		return null;
	}

	scanner.advance(); // consume closing ':'
	return emoji(name);
}

// Whole-input rule: optional whitespace, then 1-3 shortcode emojis separated
// by whitespace, then end of input (mirrors `Start = @BigEmoji !.`)
function tryBigEmoji(input: string): Root | null {
	const scanner = new Scanner(input);

	const skipWhitespace = (): void => {
		while (!scanner.isEnd() && (isSpace(scanner.char()) || isNewline(scanner.char()))) {
			scanner.advance();
		}
	};

	skipWhitespace();

	const emojis: Inlines[] = [];
	while (emojis.length < 3 && !scanner.isEnd()) {
		if (scanner.char() !== ':') {
			return null;
		}
		const node = tryEmojiShortCode(scanner);
		if (node === null) {
			return null;
		}
		emojis.push(node);
		skipWhitespace();
	}

	if (emojis.length === 0 || !scanner.isEnd()) {
		return null;
	}

	return [bigEmoji(emojis as any)];
}

// ─── Email ─────────────────────────────────────────────────────────────────

function tryEmail(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	const delimiter = 'mailto:';

	// Optional "mailto:" prefix — consumed, but NOT part of the captured address
	if (scanner.matches(delimiter)) {
		scanner.advance(delimiter.length);
	}

	// Local part: alphanumeric / unicode, plus  . _ + - '
	const localStart = scanner.save();
	while (!scanner.isEnd()) {
		const ch = scanner.char();
		if (isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '_' || ch === '+' || ch === '-' || ch === "'") {
			scanner.advance();
		} else {
			break;
		}
	}
	const local = scanner.sliceFrom(localStart);

	// Must have a non-empty local part immediately followed by '@'
	if (local.length === 0 || scanner.char() !== '@') {
		scanner.restore(start);
		return null;
	}
	scanner.advance(); // consume '@'

	// Domain: alphanumeric / unicode, plus  . -
	const domainStart = scanner.save();
	while (!scanner.isEnd()) {
		const ch = scanner.char();
		if (isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '-') {
			scanner.advance();
		} else {
			break;
		}
	}

	// Trim trailing '.' / '-' back out of the domain ("joe.com." → "joe.com")
	while (scanner.pos > domainStart && (scanner.charAt(-1) === '.' || scanner.charAt(-1) === '-')) {
		scanner.advance(-1);
	}

	const domain = scanner.sliceFrom(domainStart);

	// Domain must contain a dot that is not at the very start or end
	const dotIdx = domain.indexOf('.');
	if (dotIdx <= 0 || dotIdx === domain.length - 1) {
		scanner.restore(start);
		return null;
	}

	// autoEmail validates the TLD via tldts (same logic the grammar uses):
	return autoEmail(local + '@' + domain);
}

// ─── Phone ─────────────────────────────────────────────────────────────────
function parsePhoneDigits(scanner: Scanner): string | null {
	const s = scanner.save();
	while (!scanner.isEnd() && isDigit(scanner.char())) {
		scanner.advance();
	}
	const d = scanner.sliceFrom(s);
	return d.length > 0 ? d : null;
}

function parsePhonePrefix(scanner: Scanner): { text: string; number: string } | null {
	if (scanner.char() === '(') {
		const s = scanner.save();
		scanner.advance();
		const d = parsePhoneDigits(scanner);
		if (d !== null && scanner.char() === ')') {
			scanner.advance();
			return { text: '(' + d + ')', number: d };
		}
		scanner.restore(s);
	}
	const d = parsePhoneDigits(scanner);
	if (d !== null) {
		return { text: d, number: d };
	}
	return null;
}

function parsePhoneNumber(scanner: Scanner): { text: string; number: string } | null {
	// prefix "-" digits
	{
		const s = scanner.save();
		const p = parsePhonePrefix(scanner);
		if (p !== null && scanner.char() === '-') {
			scanner.advance();
			const d = parsePhoneDigits(scanner);
			if (d !== null) {
				return { text: p.text + '-' + d, number: p.number + d };
			}
		}
		scanner.restore(s);
	}
	// prefix digits "-" digits
	{
		const s = scanner.save();
		const p = parsePhonePrefix(scanner);
		if (p !== null) {
			const d1 = parsePhoneDigits(scanner);
			if (d1 !== null && scanner.char() === '-') {
				scanner.advance();
				const d2 = parsePhoneDigits(scanner);
				if (d2 !== null) {
					return { text: p.text + d1 + '-' + d2, number: p.number + d1 + d2 };
				}
			}
		}
		scanner.restore(s);
	}
	// prefix digits
	{
		const s = scanner.save();
		const p = parsePhonePrefix(scanner);
		if (p !== null) {
			const d = parsePhoneDigits(scanner);
			if (d !== null) {
				return { text: p.text + d, number: p.number + d };
			}
		}
		scanner.restore(s);
	}
	// digits
	{
		const d = parsePhoneDigits(scanner);
		if (d !== null) {
			return { text: d, number: d };
		}
	}
	return null;
}

function tryPhone(scanner: Scanner): Inlines | null {
	const start = scanner.save();
	if (scanner.char() !== '+') {
		return null;
	}
	scanner.advance(); // consume '+'

	const pn = parsePhoneNumber(scanner);
	if (pn === null) {
		scanner.restore(start);
		return null;
	}

	// phoneChecker returns a tel: LINK when number has >= 5 digits,
	// or PLAIN_TEXT otherwise (region still consumed → stays plain text).
	return phoneChecker('+' + pn.text, pn.number);
}
