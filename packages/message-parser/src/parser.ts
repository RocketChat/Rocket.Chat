import type {
	Root,
	Inlines,
	Markup,
	Bold,
	Italic,
	Strike,
	Spoiler,
	Timestamp,
	BigEmoji,
	Heading,
	Code,
	Quote,
	SpoilerBlock,
	UnorderedList,
	OrderedList,
	KaTeX,
} from './definitions';
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
	autoEmail,
	phoneChecker,
	timestamp,
	timestampFromHours,
	timestampFromIsoTime,
	bigEmoji,
	emoji,
	emoticon,
} from './utils';
import { Scanner } from './scanner';
import { isNewline, isPlainChar, isSpace, isAlpha, isAlphaNum, isDigit, EMOTICON_KEYS, EMOTICONS } from './chars';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function consumeEndOfLine(scanner: Scanner): void {
	if (scanner.isEnd()) return;
	if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
		scanner.consume(2);
	} else {
		scanner.consume(1);
	}
}

function isShortCodeChar(ch: string): boolean {
	return isAlphaNum(ch) || ch === '-' || ch === '_' || ch === '+' || ch === '.';
}

/** True when every node is whitespace-only plain text (e.g. `* *` between delimiters). */
function isWhitespaceOnly(nodes: Inlines[]): boolean {
	return nodes.every((n) => n.type === 'PLAIN_TEXT' && n.value.trim() === '');
}

export function matchEmoticon(scanner: Scanner): Inlines | null {
	for (const key of EMOTICON_KEYS) {
		if (scanner.matches(key)) {
			scanner.consume(key.length);
			return emoticon(key, EMOTICONS[key]);
		}
	}
	return null;
}

// ───  Re-entrancy guards ───────────────────────────────────────────────────

let skipBold = false;
let skipItalic = false;
let skipStrike = false;

// ───  Entry point ──────────────────────────────────────────────────────────

export function parse(input: string, options: Options = {}): Root {
	const bigEmojiRoot = tryBigEmoji(input, options);
	if (bigEmojiRoot !== null) {
		return bigEmojiRoot;
	}

	const root: Root = [];
	const scanner = new Scanner(input);

	while (!scanner.isEnd()) {
		const start = scanner.position();
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.consume();
		}
		const text = scanner.sliceFrom(start);
		const isLastPosition = scanner.isEnd();

		if (text === '') {
			if (!isLastPosition) {
				root.push(lineBreak());
			}
		} else {
			scanner.backtrack(start);

			const katexBlockNode: KaTeX | null = tryKatexBlock(scanner, options);
			if (katexBlockNode !== null) {
				root.push(katexBlockNode);
				continue;
			}

			const codeFenceNode: Code | null = tryCodeFence(scanner);
			if (codeFenceNode !== null) {
				root.push(codeFenceNode);
				continue;
			}

			const blockSpoilerNode: SpoilerBlock | null = tryBlockSpoiler(scanner, options);
			if (blockSpoilerNode !== null) {
				root.push(blockSpoilerNode);
				continue;
			}

			const blockquoteNode: Quote | null = tryBlockquote(scanner, options);
			if (blockquoteNode !== null) {
				root.push(blockquoteNode);
				continue;
			}

			const unorderedListNode: UnorderedList | null = tryUnorderedList(scanner, options);
			if (unorderedListNode !== null) {
				root.push(unorderedListNode);
				continue;
			}

			const orderedListNode: OrderedList | null = tryOrderedList(scanner, options);
			if (orderedListNode !== null) {
				root.push(orderedListNode);
				continue;
			}

			const headingNode: Heading | null = tryHeading(scanner, options);
			if (headingNode !== null) {
				root.push(headingNode);
				continue;
			}

			const inlines = parseInline(scanner, options);
			if (inlines.length > 0) {
				root.push(paragraph(inlines));
			}
		}

		consumeEndOfLine(scanner); // Skip newline character(s)
	}

	return root;
}

function parseInline(scanner: Scanner, options: Options): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		const ch = scanner.char();

		if (isSpace(ch)) {
			const start = scanner.position();
			while (!scanner.isEnd() && isSpace(scanner.char())) {
				scanner.consume();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// Emoticon — only at a word boundary (when emoticons are enabled)
		if (options.emoticons && (prevChar === '' || isSpace(prevChar))) {
			const result = tryEmoticon(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ')';
				continue;
			}
		}

		if (ch === '$' || (ch === '\\' && scanner.charAt(1) === '(')) {
			const result = tryKatexInline(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.consume(2);
				nodes.push(plain(next));
				prevChar = next;
				continue;
			}
			nodes.push(plain('\\'));
			scanner.consume();
			prevChar = '\\';
			continue;
		}

		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '`';
				continue;
			}
		}

		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '*';
				continue;
			}
		}

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

		if (ch === '~') {
			const result = tryStrike(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '~';
				continue;
			}
		}

		if (ch === ':') {
			const result = tryEmojiShortCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ':';
				continue;
			}
		}

		if (ch === '@') {
			const result = tryUserMention(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '@';
				continue;
			}
		}

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

		if (ch === '[') {
			const result = tryMarkdownLink(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ']';
				continue;
			}
		}

		if (ch === '<') {
			const tsResult = tryTimestamp(scanner);
			if (tsResult !== null) {
				nodes.push(tsResult);
				prevChar = '>';
				continue;
			}
		}

		if (ch === '<') {
			const result = tryAngleBracketLink(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '>';
				continue;
			}
		}

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

		// Email (local@domain)
		if (isAlpha(ch) || isDigit(ch) || ch.charCodeAt(0) > 127) {
			const result = tryEmail(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		if (isAlpha(ch)) {
			const result = tryBareUrl(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		if (isAlpha(ch) || isDigit(ch)) {
			const result = tryAutoLinkUrl(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		if (isPlainChar(ch) && ch !== '(' && ch !== ')') {
			const start = scanner.position();
			while (
				!scanner.isEnd() &&
				isPlainChar(scanner.char()) &&
				!isSpace(scanner.char()) &&
				scanner.char() !== '(' &&
				scanner.char() !== ')'
			) {
				scanner.consume();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		nodes.push(plain(ch));
		prevChar = ch;
		scanner.consume();
	}

	return reducePlainTexts(nodes);
}

function parseInlineContent(scanner: Scanner, options: Options, stopChar: string): Inlines[] {
	const nodes: Inlines[] = [];
	let prevChar = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.matches(stopChar)) break;
		const ch = scanner.char();

		if (isSpace(ch)) {
			const start = scanner.position();
			while (!scanner.isEnd() && isSpace(scanner.char()) && !scanner.matches(stopChar)) {
				scanner.consume();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		// Emoticon — only at a word boundary (when emoticons are enabled)
		if (options.emoticons && (prevChar === '' || isSpace(prevChar))) {
			const result = tryEmoticon(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ')';
				continue;
			}
		}

		if (ch === '$' || (ch === '\\' && scanner.charAt(1) === '(')) {
			const result = tryKatexInline(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.consume(2);
				nodes.push(plain(next));
				prevChar = next;
				continue;
			}
			nodes.push(plain('\\'));
			scanner.consume();
			prevChar = '\\';
			continue;
		}

		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '`';
				continue;
			}
		}

		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '*';
				continue;
			}
		}

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

		if (ch === '~') {
			const result = tryStrike(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '~';
				continue;
			}
		}

		if (ch === ':') {
			const result = tryEmojiShortCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ':';
				continue;
			}
		}

		if (ch === '@') {
			const result = tryUserMention(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '@';
				continue;
			}
		}

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

		if (ch === '[') {
			const result = tryMarkdownLink(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = ']';
				continue;
			}
		}

		if (ch === '<') {
			const tsResult = tryTimestamp(scanner);
			if (tsResult !== null) {
				nodes.push(tsResult);
				prevChar = '>';
				continue;
			}
		}

		if (ch === '<') {
			const result = tryAngleBracketLink(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '>';
				continue;
			}
		}

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

		// Email (local@domain)
		if (isAlpha(ch) || isDigit(ch) || ch.charCodeAt(0) > 127) {
			const result = tryEmail(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		if (isAlpha(ch)) {
			const result = tryBareUrl(scanner);
			if (result !== null) {
				nodes.push(result);
				prevChar = ch;
				continue;
			}
		}

		if (isAlpha(ch) || isDigit(ch)) {
			const result = tryAutoLinkUrl(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prevChar = '';
				continue;
			}
		}

		if (isPlainChar(ch) && ch !== '(' && ch !== ')') {
			const start = scanner.position();
			while (
				!scanner.isEnd() &&
				isPlainChar(scanner.char()) &&
				!isSpace(scanner.char()) &&
				!scanner.matches(stopChar) &&
				scanner.char() !== '(' &&
				scanner.char() !== ')'
			) {
				scanner.consume();
			}
			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}

		nodes.push(plain(ch));
		prevChar = ch;
		scanner.consume();
	}

	return nodes;
}

// ─── Inline methods ──────────────────────────────────────────────────────────────

function tryBold(scanner: Scanner, options: Options): Inlines | null {
	if (skipBold) return null;
	const start = scanner.position();
	if (scanner.matches('***')) {
		scanner.consume(1);
		return plain('*');
	}
	const isDouble = scanner.matches('**');
	const delimiter = isDouble ? '**' : '*';
	scanner.consume(delimiter.length);
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	skipBold = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipBold = false;
	if (!scanner.matches(delimiter)) {
		scanner.backtrack(start);
		return null;
	}
	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (isWhitespaceOnly(content)) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(delimiter.length);
	return bold(reducePlainTexts(content) as Bold['value']);
}

function tryItalic(scanner: Scanner, options: Options): Inlines | null {
	if (skipItalic) return null;
	const start = scanner.position();
	if (scanner.matches('___')) {
		scanner.consume(1);
		return plain('_');
	}
	const isDouble = scanner.matches('__');
	const delimiter = isDouble ? '__' : '_';
	scanner.consume(delimiter.length);
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	skipItalic = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipItalic = false;
	if (!scanner.matches(delimiter)) {
		scanner.backtrack(start);
		return null;
	}
	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (isWhitespaceOnly(content)) {
		scanner.backtrack(start);
		return null;
	}
	if (isDouble && isAlphaNum(scanner.charAt(delimiter.length))) {
		scanner.backtrack(start);
		return null;
	}
	if (!isDouble && isAlpha(scanner.charAt(delimiter.length))) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(delimiter.length);
	return italic(reducePlainTexts(content) as Italic['value']);
}

function tryStrike(scanner: Scanner, options: Options): Inlines | null {
	if (skipStrike) return null;
	const start = scanner.position();
	if (scanner.matches('~~~')) {
		scanner.consume(1);
		return plain('~');
	}
	const isDouble = scanner.matches('~~');
	const delimiter = isDouble ? '~~' : '~';
	scanner.consume(delimiter.length);
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	skipStrike = true;
	const content = parseInlineContent(scanner, options, delimiter);
	skipStrike = false;
	if (!scanner.matches(delimiter)) {
		scanner.backtrack(start);
		return null;
	}
	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (isWhitespaceOnly(content)) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(delimiter.length);
	return strike(reducePlainTexts(content) as Strike['value']);
}

function tryInlineCode(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	scanner.consume();
	const contentStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '`') {
		scanner.consume();
	}
	if (scanner.isEnd() || isNewline(scanner.char()) || scanner.char() !== '`') {
		scanner.backtrack(start);
		return null;
	}
	const content = scanner.sliceFrom(contentStart);
	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume();
	return inlineCode(plain(content));
}

function tryEmail(scanner: Scanner): Inlines | null {
	const start = scanner.position();

	if (scanner.matches('mailto:')) {
		scanner.consume(7);
	}

	const localStart = scanner.position();
	while (!scanner.isEnd()) {
		const ch = scanner.char();
		if (isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '_' || ch === '+' || ch === '-' || ch === "'") {
			scanner.consume();
		} else {
			break;
		}
	}
	const local = scanner.sliceFrom(localStart);

	if (local.length === 0 || scanner.char() !== '@') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(); // consume '@'

	const domainStart = scanner.position();
	while (!scanner.isEnd()) {
		const ch = scanner.char();
		if (isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '-') {
			scanner.consume();
		} else {
			break;
		}
	}

	// Trim trailing '.' / '-' back out of the domain (e.g. "joe.com." -> "joe.com")
	while (scanner.position() > domainStart && (scanner.charAt(-1) === '.' || scanner.charAt(-1) === '-')) {
		scanner.consume(-1);
	}

	const domain = scanner.sliceFrom(domainStart);
	const dotIdx = domain.indexOf('.');
	if (dotIdx <= 0 || dotIdx === domain.length - 1) {
		scanner.backtrack(start);
		return null;
	}

	return autoEmail(local + '@' + domain);
}

function tryPhone(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	if (scanner.char() !== '+') {
		return null;
	}
	scanner.consume(); // consume '+'

	// Read a run of digits (or null if none here).
	const digits = (): string | null => {
		const s = scanner.position();
		while (!scanner.isEnd() && isDigit(scanner.char())) {
			scanner.consume();
		}
		const d = scanner.sliceFrom(s);
		return d.length > 0 ? d : null;
	};

	// Prefix is either bare digits or "(" digits ")".
	const prefix = (): { text: string; number: string } | null => {
		if (scanner.char() === '(') {
			const s = scanner.position();
			scanner.consume();
			const d = digits();
			if (d !== null && scanner.char() === ')') {
				scanner.consume();
				return { text: '(' + d + ')', number: d };
			}
			scanner.backtrack(s);
		}
		const d = digits();
		return d !== null ? { text: d, number: d } : null;
	};

	// PhoneNumber alternatives, in order: each backtracks on failure.
	let pn: { text: string; number: string } | null = null;

	// prefix "-" digits
	{
		const s = scanner.position();
		const p = prefix();
		if (p !== null && scanner.char() === '-') {
			scanner.consume();
			const d = digits();
			if (d !== null) pn = { text: p.text + '-' + d, number: p.number + d };
		}
		if (pn === null) scanner.backtrack(s);
	}
	// prefix digits "-" digits
	if (pn === null) {
		const s = scanner.position();
		const p = prefix();
		if (p !== null) {
			const d1 = digits();
			if (d1 !== null && scanner.char() === '-') {
				scanner.consume();
				const d2 = digits();
				if (d2 !== null) pn = { text: p.text + d1 + '-' + d2, number: p.number + d1 + d2 };
			}
		}
		if (pn === null) scanner.backtrack(s);
	}
	// prefix digits
	if (pn === null) {
		const s = scanner.position();
		const p = prefix();
		if (p !== null) {
			const d = digits();
			if (d !== null) pn = { text: p.text + d, number: p.number + d };
		}
		if (pn === null) scanner.backtrack(s);
	}
	// digits
	if (pn === null) {
		const d = digits();
		if (d !== null) pn = { text: d, number: d };
	}

	if (pn === null) {
		scanner.backtrack(start);
		return null;
	}

	// phoneChecker returns a tel: LINK when the number has >= 5 digits,
	// otherwise PLAIN_TEXT (the region is still consumed).
	return phoneChecker('+' + pn.text, pn.number);
}

function tryTimestamp(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	if (!scanner.matches('<t:')) return null;
	scanner.consume(3);

	// Read exactly n digits, or backtrack and return null.
	const exact = (n: number): string | null => {
		const s = scanner.position();
		for (let i = 0; i < n; i++) {
			if (!isDigit(scanner.char())) {
				scanner.backtrack(s);
				return null;
			}
			scanner.consume();
		}
		return scanner.sliceFrom(s);
	};

	// Optional timezone "(+|-)HH:MM".
	const timezone = (): string | undefined => {
		const s = scanner.position();
		const sign = scanner.char();
		if (sign !== '+' && sign !== '-') return undefined;
		scanner.consume();
		const h = exact(2);
		if (h === null || scanner.char() !== ':') {
			scanner.backtrack(s);
			return undefined;
		}
		scanner.consume();
		const m = exact(2);
		if (m === null) {
			scanner.backtrack(s);
			return undefined;
		}
		return sign + h + ':' + m;
	};

	// ISO 8601: YYYY-MM-DDTHH:MM:SS[.mmm][tz]
	const iso = (withMs: boolean): string | null => {
		const s = scanner.position();
		const year = exact(4);
		if (year === null || scanner.char() !== '-') {
			scanner.backtrack(s);
			return null;
		}
		scanner.consume();
		const month = exact(2);
		if (month === null || scanner.char() !== '-') {
			scanner.backtrack(s);
			return null;
		}
		scanner.consume();
		const day = exact(2);
		if (day === null || scanner.char() !== 'T') {
			scanner.backtrack(s);
			return null;
		}
		scanner.consume();
		const hours = exact(2);
		if (hours === null || scanner.char() !== ':') {
			scanner.backtrack(s);
			return null;
		}
		scanner.consume();
		const minutes = exact(2);
		if (minutes === null || scanner.char() !== ':') {
			scanner.backtrack(s);
			return null;
		}
		scanner.consume();
		const seconds = exact(2);
		if (seconds === null) {
			scanner.backtrack(s);
			return null;
		}
		let milliseconds: string | undefined;
		if (withMs) {
			if (scanner.char() !== '.') {
				scanner.backtrack(s);
				return null;
			}
			scanner.consume();
			const ms = exact(3);
			if (ms === null) {
				scanner.backtrack(s);
				return null;
			}
			milliseconds = ms;
		}
		return timestampFromIsoTime({ year, month, day, hours, minutes, seconds, milliseconds, timezone: timezone() });
	};

	// Relative time: HH:MM:SS or HH:MM, optional tz.
	const relTime = (): string | null => {
		{
			const s = scanner.position();
			const h = exact(2);
			if (h !== null && scanner.char() === ':') {
				scanner.consume();
				const m = exact(2);
				if (m !== null && scanner.char() === ':') {
					scanner.consume();
					const sec = exact(2);
					if (sec !== null) return timestampFromHours(h, m, sec, timezone());
				}
			}
			scanner.backtrack(s);
		}
		{
			const s = scanner.position();
			const h = exact(2);
			if (h !== null && scanner.char() === ':') {
				scanner.consume();
				const m = exact(2);
				if (m !== null) return timestampFromHours(h, m, undefined, timezone());
			}
			scanner.backtrack(s);
		}
		return null;
	};

	// date = Unixtime(10) / ISO-with-ms / ISO-no-ms / relative
	const date = exact(10) ?? iso(true) ?? iso(false) ?? relTime();
	if (date === null) {
		scanner.backtrack(start);
		return null;
	}

	// "<t:" date ":" format ">"
	if (scanner.char() === ':') {
		scanner.consume();
		const fmt = scanner.char();
		if (fmt !== '' && 'tTdDfFR'.includes(fmt) && scanner.charAt(1) === '>') {
			scanner.consume(2);
			return timestamp(date, fmt as Timestamp['value']['format']);
		}
		scanner.backtrack(start);
		return null;
	}

	// "<t:" date ">"
	if (scanner.char() === '>') {
		scanner.consume();
		return timestamp(date);
	}

	scanner.backtrack(start);
	return null;
}

function tryEmoticon(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	const node = matchEmoticon(scanner);
	if (node === null) return null;
	const after = scanner.char();
	if (after === '' || isSpace(after) || isNewline(after) || after === '*') {
		return node;
	}
	scanner.backtrack(start);
	return null;
}

function tryUserMention(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	scanner.consume();
	const nameStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		const code = ch.charCodeAt(0);
		if (isAlphaNum(ch) || ch === '.' || ch === '-' || ch === '_' || ch === ':' || ch === '@' || code > 127) {
			scanner.consume();
		} else {
			break;
		}
	}
	const name = scanner.sliceFrom(nameStart);
	if (name.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (name.endsWith('__')) {
		scanner.backtrack(start);
		return null;
	}
	return mentionUser(name);
}

function tryChannelMention(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	scanner.consume();
	const nameStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		if (!isAlphaNum(ch) && ch !== '-' && ch !== '_' && ch !== '.') break;
		scanner.consume();
	}
	const name = scanner.sliceFrom(nameStart);
	if (name.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	return mentionChannel(name);
}

function trySpoiler(scanner: Scanner, options: Options): Inlines | null {
	const spoilerChar = '||';
	const start = scanner.position();
	if (!scanner.matches(spoilerChar)) {
		return null;
	}
	scanner.consume(spoilerChar.length);
	if (scanner.matches('||')) {
		scanner.backtrack(start);
		return null;
	}
	const content = parseInlineContent(scanner, options, '||');
	if (!scanner.matches(spoilerChar)) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(spoilerChar.length);
	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	return spoiler(reducePlainTexts(content) as Spoiler['value']);
}

function tryMarkdownLink(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.position();
	if (scanner.char() !== '[') {
		return null;
	}
	scanner.consume();

	// --- title (restricted: ws / escape / code / bold / italic / strike / plain) ---
	const titleNodes: Inlines[] = [];
	let prevChar = '';
	let aborted = false;

	titleLoop: while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.matches('](')) break;
		const ch = scanner.char();

		if (isSpace(ch)) {
			const s = scanner.position();
			while (!scanner.isEnd() && isSpace(scanner.char())) {
				scanner.consume();
			}
			const text = scanner.sliceFrom(s);
			titleNodes.push(plain(text));
			prevChar = text[text.length - 1] ?? '';
			continue;
		}
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				scanner.consume(2);
				titleNodes.push(plain(next));
				prevChar = next;
				continue;
			}
			titleNodes.push(plain('\\'));
			scanner.consume();
			prevChar = '\\';
			continue;
		}
		if (ch === '`') {
			const r = tryInlineCode(scanner);
			if (r !== null) {
				titleNodes.push(r);
				prevChar = '`';
				continue;
			}
		}
		if (ch === '*') {
			const r = tryBold(scanner, options);
			if (r !== null) {
				titleNodes.push(r);
				prevChar = '*';
				continue;
			}
		}
		if (ch === '_' && !isAlphaNum(prevChar)) {
			const r = tryItalic(scanner, options);
			if (r !== null) {
				titleNodes.push(r);
				prevChar = '_';
				continue;
			}
		}
		if (ch === '~') {
			const r = tryStrike(scanner, options);
			if (r !== null) {
				titleNodes.push(r);
				prevChar = '~';
				continue;
			}
		}

		if (ch === ']') {
			// abort on a "] [...](" boundary: bracketed text preceding a real link
			if (scanner.charAt(1) === ' ' && scanner.charAt(2) === '[') {
				let off = 3;
				for (;;) {
					const c = scanner.charAt(off);
					if (c === '' || isNewline(c)) break;
					if (c === ']') {
						if (scanner.charAt(off + 1) === '(') aborted = true;
						break;
					}
					off++;
				}
				if (aborted) break titleLoop;
			}
			titleNodes.push(plain(']'));
			scanner.consume();
			prevChar = ']';
			continue;
		}

		// plain run
		const s = scanner.position();
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			const c = scanner.char();
			if (isSpace(c) || c === '*' || c === '_' || c === '~' || c === '`' || c === ']') break;
			scanner.consume();
		}
		const text = scanner.sliceFrom(s);
		if (text.length === 0) {
			titleNodes.push(plain(ch));
			scanner.consume();
			prevChar = ch;
		} else {
			titleNodes.push(plain(text));
			prevChar = text[text.length - 1];
		}
	}

	if (aborted) {
		scanner.consume(); // consume the ']' we stopped on
		return plain(scanner.sliceFrom(start));
	}

	// --- "](", url, link ---
	if (!scanner.matches('](')) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(2);
	const urlStart = scanner.position();
	let depth = 1;
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.char() === '(') depth++;
		if (scanner.char() === ')') {
			depth--;
			if (depth === 0) break;
		}
		scanner.consume();
	}
	if (!scanner.matches(')')) {
		scanner.backtrack(start);
		return null;
	}
	const url = scanner.sliceFrom(urlStart);
	scanner.consume();
	if (url.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	const title = reducePlainTexts(titleNodes);
	if (title.length === 0) {
		return link(url);
	}
	return link(url, title as Markup[]);
}

function tryAngleBracketLink(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	if (scanner.char() !== '<') {
		return null;
	}
	scanner.consume();
	const urlStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.char() === '|' || scanner.char() === '>') break;
		scanner.consume();
	}
	const url = scanner.sliceFrom(urlStart);
	if (url.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (scanner.char() !== '|') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume();
	const titleStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '>') {
		scanner.consume();
	}
	if (scanner.char() !== '>') {
		scanner.backtrack(start);
		return null;
	}
	const title = scanner.sliceFrom(titleStart);
	scanner.consume();
	return link(url, [plain(title)]);
}

function tryBareUrl(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	if (!isAlpha(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	while (!scanner.isEnd() && (isAlphaNum(scanner.char()) || scanner.char() === '-')) {
		scanner.consume();
	}
	if (scanner.isEnd() || scanner.char() !== '.') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume();
	if (scanner.isEnd() || !isAlphaNum(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
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
			scanner.consume();
		} else {
			break;
		}
	}
	const raw = scanner.sliceFrom(start);
	const dotIdx = raw.indexOf('.');
	if (dotIdx <= 0 || dotIdx === raw.length - 1) {
		scanner.backtrack(start);
		return null;
	}
	const result = autoLink(raw);
	if (result.type === 'PLAIN_TEXT') {
		scanner.backtrack(start);
		return null;
	}
	return result;
}

function tryKatexInline(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.position();
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
	scanner.consume(openDelim.length);
	const contentStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.matches(closeDelim)) break;
		scanner.consume();
	}
	if (!scanner.matches(closeDelim)) {
		scanner.backtrack(start);
		return null;
	}
	const content = scanner.sliceFrom(contentStart);
	scanner.consume(closeDelim.length);
	return inlineKatex(content);
}

function tryAutoLinkUrl(scanner: Scanner, options: Options): Inlines | null {
	const start = scanner.position();
	const tokenStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		scanner.consume();
	}
	const token = scanner.sliceFrom(tokenStart);
	if (token.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (!token.includes('://') && !token.includes('.')) {
		scanner.backtrack(start);
		return null;
	}
	let url = token;
	while (url.length > 0 && '.,!?;:)'.includes(url[url.length - 1])) {
		url = url.slice(0, -1);
	}
	if (url.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	scanner.backtrack(tokenStart);
	scanner.consume(url.length);
	const result = autoLink(url, options.customDomains);
	if (result.type === 'PLAIN_TEXT') {
		scanner.backtrack(start);
		return null;
	}
	return result;
}

function tryEmojiShortCode(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	scanner.consume();
	const nameStart = scanner.position();
	while (!scanner.isEnd() && isShortCodeChar(scanner.char())) {
		scanner.consume();
	}
	const name = scanner.sliceFrom(nameStart);
	if (name.length === 0 || scanner.char() !== ':') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume();
	return emoji(name);
}

// ─── Block methods ──────────────────────────────────────────────────────────────

function tryCodeFence(scanner: Scanner): Code | null {
	const fence = '```';
	const start = scanner.position();
	if (!scanner.matches(fence)) {
		return null;
	}
	scanner.consume(fence.length);
	const langStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.consume();
	}
	const language = scanner.sliceFrom(langStart).trim();
	if (scanner.isEnd()) {
		scanner.backtrack(start);
		return null;
	}
	consumeEndOfLine(scanner);
	const lines: ReturnType<typeof codeLine>[] = [];
	while (!scanner.isEnd()) {
		if (scanner.matches('```')) {
			scanner.consume(fence.length);
			while (!scanner.isEnd() && !isNewline(scanner.char())) {
				scanner.consume();
			}
			return code(lines, language || undefined);
		}
		const lineStart = scanner.position();
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.consume();
		}
		const lineText = scanner.sliceFrom(lineStart);
		lines.push(codeLine(plain(lineText)));
		consumeEndOfLine(scanner);
	}
	scanner.backtrack(start);
	return null;
}

function tryHeading(scanner: Scanner, options: Options): Heading | null {
	const start = scanner.position();
	let level = 0;
	while (level < 4 && scanner.char() === '#') {
		level++;
		scanner.consume();
	}
	if (level === 0) {
		scanner.backtrack(start);
		return null;
	}
	if (!isSpace(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	while (isSpace(scanner.char())) {
		scanner.consume();
	}
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	const inlines = parseInline(scanner, options);
	consumeEndOfLine(scanner);
	return heading(inlines, level as 1 | 2 | 3 | 4);
}

function tryBlockquote(scanner: Scanner, options: Options): Quote | null {
	const start = scanner.position();
	if (scanner.char() !== '>') {
		return null;
	}
	const paragraphs: ReturnType<typeof paragraph>[] = [];
	while (!scanner.isEnd() && scanner.char() === '>') {
		const lineStart = scanner.position();
		scanner.consume();
		if (isSpace(scanner.char())) {
			scanner.consume();
		}
		if (isNewline(scanner.char())) {
			paragraphs.push(paragraph([plain('')]));
		} else if (scanner.isEnd()) {
			scanner.backtrack(lineStart);
			break;
		} else {
			const inlines = parseInline(scanner, options);
			paragraphs.push(paragraph(inlines));
		}
		consumeEndOfLine(scanner);
	}
	if (paragraphs.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	return quote(paragraphs);
}

function tryBlockSpoiler(scanner: Scanner, options: Options): SpoilerBlock | null {
	const spoilerChar = '||';
	const start = scanner.position();
	if (!scanner.matches(spoilerChar)) {
		return null;
	}
	scanner.consume(spoilerChar.length);
	if (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	// "||" alone at end of input (no content) is not a block spoiler.
	if (scanner.isEnd()) {
		scanner.backtrack(start);
		return null;
	}
	consumeEndOfLine(scanner);
	const paragraphs: ReturnType<typeof paragraph>[] = [];
	while (!scanner.isEnd()) {
		if (scanner.matches('||')) {
			const closingPos = scanner.position();
			scanner.consume(spoilerChar.length);
			if (scanner.isEnd() || isNewline(scanner.char())) {
				if (paragraphs.length === 0) {
					scanner.backtrack(start);
					return null;
				}
				return spoilerBlock(paragraphs);
			}
			scanner.backtrack(closingPos);
		}
		const inlines = parseInline(scanner, options);
		paragraphs.push(paragraph(inlines));
		consumeEndOfLine(scanner);
	}
	scanner.backtrack(start);
	return null;
}

function tryUnorderedList(scanner: Scanner, options: Options): UnorderedList | null {
	const start = scanner.position();
	const marker = scanner.char();
	if (marker !== '-' && marker !== '*') {
		return null;
	}
	if (!isSpace(scanner.charAt(1))) {
		return null;
	}
	const items: ReturnType<typeof listItem>[] = [];
	while (!scanner.isEnd()) {
		const itemStart = scanner.position();
		const ch = scanner.char();
		if (ch !== marker) break;
		if (!isSpace(scanner.charAt(1))) break;
		scanner.consume();
		while (isSpace(scanner.char())) {
			scanner.consume();
		}
		const inlines = parseInline(scanner, options);
		// Grammar: UnorderedListItemContent = ...+ !"*". An asterisk-bulleted item
		// whose content is empty or ends with a dangling '*' is not a list item
		// (e.g. "* *", "* Hello*") — let it fall through to inline emphasis.
		if (marker === '*') {
			const last = inlines[inlines.length - 1];
			if (inlines.length === 0 || (last.type === 'PLAIN_TEXT' && last.value.endsWith('*'))) {
				scanner.backtrack(itemStart);
				break;
			}
		}
		items.push(listItem(inlines));
		consumeEndOfLine(scanner);
	}
	if (items.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	return unorderedList(items);
}

function tryOrderedList(scanner: Scanner, options: Options): OrderedList | null {
	const start = scanner.position();
	if (!isDigit(scanner.char())) {
		return null;
	}
	const peekStart = scanner.position();
	while (!scanner.isEnd() && isDigit(scanner.char())) {
		scanner.consume();
	}
	if (scanner.char() !== '.') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume();
	if (!isSpace(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}
	scanner.backtrack(peekStart);
	const items: ReturnType<typeof listItem>[] = [];
	while (!scanner.isEnd()) {
		if (!isDigit(scanner.char())) break;
		const numStart = scanner.position();
		while (!scanner.isEnd() && isDigit(scanner.char())) {
			scanner.consume();
		}
		const numStr = scanner.sliceFrom(numStart);
		if (scanner.char() !== '.') {
			scanner.backtrack(start);
			return null;
		}
		scanner.consume();
		if (!isSpace(scanner.char())) {
			scanner.backtrack(start);
			return null;
		}
		while (isSpace(scanner.char())) {
			scanner.consume();
		}
		const inlines = parseInline(scanner, options);
		items.push(listItem(inlines, parseInt(numStr, 10)));
		consumeEndOfLine(scanner);
	}
	if (items.length === 0) {
		scanner.backtrack(start);
		return null;
	}
	return orderedList(items);
}

function tryKatexBlock(scanner: Scanner, options: Options): KaTeX | null {
	const start = scanner.position();
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
	scanner.consume(openDelim.length);
	const contentStart = scanner.position();
	while (!scanner.isEnd()) {
		if (scanner.matches(closeDelim)) break;
		scanner.consume();
	}
	if (!scanner.matches(closeDelim)) {
		scanner.backtrack(start);
		return null;
	}
	const content = scanner.sliceFrom(contentStart);
	scanner.consume(closeDelim.length);
	return katex(content);
}

function tryBigEmoji(input: string, options: Options): [BigEmoji] | null {
	const scanner = new Scanner(input);

	const skipWhitespace = (): void => {
		while (!scanner.isEnd() && (isSpace(scanner.char()) || isNewline(scanner.char()))) {
			scanner.consume();
		}
	};
	skipWhitespace();
	const emojis: Inlines[] = [];
	while (emojis.length < 3 && !scanner.isEnd()) {
		let node: Inlines | null = null;
		if (scanner.char() === ':') {
			node = tryEmojiShortCode(scanner);
		}
		if (node === null && options.emoticons) {
			node = matchEmoticon(scanner);
		}
		if (node === null) {
			return null;
		}
		emojis.push(node);
		skipWhitespace();
	}
	if (emojis.length === 0 || !scanner.isEnd()) {
		return null;
	}
	return [bigEmoji(emojis as BigEmoji['value'])];
}
