import {
	isNewline,
	isPlainChar,
	isSpace,
	isAlpha,
	isAlphaNum,
	isDigit,
	EMOTICON_KEYS,
	EMOTICONS,
	isHexDigit,
	isEmojiStart,
	isUrlStart,
	isEmailStart,
} from './chars';
import type {
	Root,
	Inlines,
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
	LineBreak,
	CodeLine,
	Paragraph,
	ListItem,
	Tasks,
	Task,
	HorizontalRule,
	Table,
	TableCellAlignment,
	Markup,
} from './definitions';
import type { Options } from './index';
import { Scanner } from './scanner';
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
	emojiUnicode,
	color,
	image,
	tasks,
	task,
	horizontalRule,
	table,
} from './utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCAPABLE = new Set(['*', '_', '~', '`', '#', '.']);
const UNICODE_EMOJI = new RegExp('^\\p{RGI_Emoji}\\uFE0F?', 'v');
const OPTIONAL_TIMEZONE_OFFSET = '([+-]\\d{2}:\\d{2})?'; // optional "+00:00" style offset
const UNIX_TIMESTAMP = /^\d{10}$/; // exactly 10 digits
const ISO_TIMESTAMP_WITH_MILLISECONDS_REGEX = new RegExp(
	`^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})\\.(\\d{3})${OPTIONAL_TIMEZONE_OFFSET}$`,
);
const ISO_TIMESTAMP_REGEX = new RegExp(`^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})${OPTIONAL_TIMEZONE_OFFSET}$`);
const TIME_HOURS_MINUTES_SECONDS_REGEX = new RegExp(`^(\\d{2}):(\\d{2}):(\\d{2})${OPTIONAL_TIMEZONE_OFFSET}$`);
const TIME_HOURS_MINUTES_REGEX = new RegExp(`^(\\d{2}):(\\d{2})${OPTIONAL_TIMEZONE_OFFSET}$`);

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

function isAnyText(ch: string): boolean {
	if (ch === '') return false;
	return (
		(ch >= ' ' && ch <= "'") || // space ! " # $ % & '
		(ch >= '+' && ch <= '@') || // + , - . / 0-9 : ; < = > ? @
		isAlpha(ch) || // A-Z or a-z
		ch.charCodeAt(0) > 127 // any non-ASCII character
	);
}

function isEmailLocalChar(ch: string): boolean {
	return isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '_' || ch === '+' || ch === '-' || ch === "'";
}

function isEmailDomainChar(ch: string): boolean {
	return isAlphaNum(ch) || ch.charCodeAt(0) > 127 || ch === '.' || ch === '-';
}

function isPhoneChar(ch: string): boolean {
	return isDigit(ch) || ch === '(' || ch === ')' || ch === '-';
}

function isValidUrlStructure(url: string): boolean {
	if (url.includes('://')) return /^[A-Za-z0-9+-]{1,32}:\/\/./.test(url); // scheme://host
	return !url.includes(':/') && /^[A-Za-z0-9][^/:?#]*\.[^/:?#]+/.test(url); // bare domain
}

// True when a `]` begins a `] [label](url)` link that follows, marking the end of the current label.
function isReferenceContinuation(scanner: Scanner): boolean {
	if (!scanner.matches('] [')) return false;
	for (let i = 3; ; i++) {
		const c = scanner.charAt(i);
		if (c === '' || isNewline(c)) return false;
		if (c === ']') return scanner.charAt(i + 1) === '(';
	}
}

// ───  Re-entrancy guards ───────────────────────────────────────────────────

let skipBold = false;
let skipItalic = false;
let skipStrike = false;
let skipReferences = false;

// ───  Entry point ──────────────────────────────────────────────────────────

export function parse(input: string, options: Options = {}) {
	// Clear the skip flags in case an earlier parse crashed before resetting them.
	skipBold = false;
	skipItalic = false;
	skipStrike = false;
	skipReferences = false;

	const bigEmojiRoot = tryBigEmoji(input, options);
	if (bigEmojiRoot !== null) {
		return bigEmojiRoot;
	}

	const root: Root = [];
	const scanner = new Scanner(input);

	while (!scanner.isEnd()) {
		const lineBreakNode: LineBreak | null = tryLineBreak(scanner);
		if (lineBreakNode !== null) {
			root.push(lineBreakNode);
			continue;
		}

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

		const horizontalRuleNode: HorizontalRule | null = tryHorizontalRule(scanner);
		if (horizontalRuleNode !== null) {
			root.push(horizontalRuleNode);
			continue;
		}

		const tableNode: Table | null = tryTable(scanner, options);
		if (tableNode !== null) {
			root.push(tableNode);
			continue;
		}

		const tasksNode: Tasks | null = tryTasks(scanner, options);
		if (tasksNode !== null) {
			root.push(tasksNode);
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

		consumeEndOfLine(scanner); // Skip newline characters
	}

	return root;
}

function parseInline(scanner: Scanner, options: Options, stopChar = '') {
	const nodes: Inlines[] = [];
	let prev = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (stopChar && scanner.matches(stopChar)) break;
		const ch = scanner.char();

		// Emoticons
		if (options.emoticons) {
			const result = tryEmoticon(scanner, prev, stopChar);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// KaTeX inline
		if (ch === '$' || (ch === '\\' && scanner.charAt(1) === '(')) {
			const result = tryKatexInline(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Escape sequences
		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				nodes.push(plain(next));
				scanner.consume(2); // consume the backslash and the escaped char
				prev = next;
				continue;
			}
		}

		// Inline code
		if (ch === '`') {
			const result = tryInlineCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Bold
		if (ch === '*') {
			const result = tryBold(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Strike
		if (ch === '~') {
			const result = tryStrike(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Italic
		if (ch === '_') {
			const result = tryItalic(scanner, options, prev);
			if (result !== null) {
				nodes.push(...result);
				prev = scanner.previous();
				continue;
			}
		}

		// Emoji shortcode (:smile:)
		if (ch === ':') {
			const result = tryEmojiShortCode(scanner);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		//  Unicode raw emoji
		if (isEmojiStart(ch)) {
			const result = tryUnicodeEmoji(scanner);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// Color (color:#rgb / rgba / rrggbb / rrggbbaa)
		if (scanner.matches('color:#')) {
			const result = tryColor(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// Phone (+number)
		if (ch === '+') {
			const result = tryPhone(scanner, prev);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// User mention
		if (ch === '@') {
			const mention = tryUserMention(scanner, prev);
			if (mention !== null) {
				nodes.push(mention);
				prev = ch;
				continue;
			}
		}

		// Email (local@domain)
		if (isEmailStart(ch)) {
			const email = tryEmail(scanner);
			if (email !== null) {
				nodes.push(email);
				prev = '';
				continue;
			}
		}

		// Mention channel
		if (ch === '#') {
			const result = tryChannelMention(scanner, prev);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Image
		if (ch === '!') {
			const result = tryImage(scanner);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// Markdown link
		if (ch === '[') {
			const result = tryMarkdownLink(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = ']';
				continue;
			}
		}

		// Timestamp
		if (ch === '\\' || ch === '<') {
			const ts = tryTimestamp(scanner);
			if (ts !== null) {
				nodes.push(ts);
				prev = '';
				continue;
			}
		}

		// Angle bracket link
		if (ch === '<') {
			const ts = tryAngleBracketLink(scanner);
			if (ts !== null) {
				nodes.push(ts);
				prev = '>';
				continue;
			}
		}

		// Inline spoiler
		if (ch === '|') {
			const result = trySpoiler(scanner, options);
			if (result !== null) {
				nodes.push(result);
				prev = ch;
				continue;
			}
		}

		// Auto link
		if (isUrlStart(ch)) {
			const result = tryAutoLinkUrl(scanner, options, prev);
			if (result !== null) {
				nodes.push(result);
				prev = '';
				continue;
			}
		}

		// Plain run
		if (isPlainChar(ch)) {
			const start = scanner.position();
			while (!scanner.isEnd() && isPlainChar(scanner.char())) {
				if (stopChar && scanner.matches(stopChar)) break;
				scanner.consume();
			}

			const text = scanner.sliceFrom(start);
			nodes.push(plain(text));
			prev = text[text.length - 1] ?? '';
			continue;
		}

		// Fallback to plain text
		nodes.push(plain(ch));
		prev = ch;
		scanner.consume();
	}

	return stopChar ? nodes : reducePlainTexts(nodes);
}

// ─── Inline methods ──────────────────────────────────────────────────────────────

function tryLineBreak(scanner: Scanner): LineBreak | null {
	if (!isNewline(scanner.char())) return null;
	consumeEndOfLine(scanner); // consume the blank line's newline so the caller can `continue`
	return lineBreak();
}

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

	let content: Inlines[];
	skipBold = true;
	try {
		content = parseInline(scanner, options, delimiter);
	} finally {
		skipBold = false;
	}

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

function tryItalic(scanner: Scanner, options: Options, prevChar: string): Inlines[] | null {
	if (skipItalic) return null;
	const start = scanner.position();

	// A word glued to underscores is plain text: `word_`, `word__`.
	if (isAlphaNum(prevChar)) {
		scanner.consume(1);
		if (scanner.matches('_')) scanner.consume(1);
		return [plain(scanner.sliceFrom(start))];
	}

	// Content can't start with `_`, so peel one `_` and retry (`___x___` -> _ + __x__ + _).
	if (scanner.matches('___')) {
		scanner.consume(1);
		return [plain('_')];
	}

	const isDouble = scanner.matches('__');
	const delimiter = isDouble ? '__' : '_';

	scanner.consume(delimiter.length);
	if (scanner.isEnd() || isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}

	let content: Inlines[];
	skipItalic = true;
	try {
		content = parseInline(scanner, options, delimiter);
	} finally {
		skipItalic = false;
	}

	if (!scanner.matches(delimiter) || content.length === 0 || isWhitespaceOnly(content)) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(delimiter.length);

	// Followed by a word (`__x__word`, `_x_word`): delimiters are plain, inner nodes kept.
	const isTrail = isDouble ? isAlphaNum : isAlpha;
	if (isTrail(scanner.char())) {
		const trailStart = scanner.position();
		while (isTrail(scanner.char())) scanner.consume();
		const trail = scanner.sliceFrom(trailStart);
		return reducePlainTexts([plain(delimiter), ...content, plain(delimiter), plain(trail)]);
	}

	// Real italic.
	return [italic(reducePlainTexts(content) as Italic['value'])];
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

	let content: Inlines[];
	skipStrike = true;
	try {
		content = parseInline(scanner, options, delimiter);
	} finally {
		skipStrike = false;
	}

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
	scanner.consume(); // consume opening backtrack(`)

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
	const delimiter = 'mailto:';

	if (scanner.matches(delimiter)) {
		scanner.consume(delimiter.length);
	}

	const localStart = scanner.position();
	while (!scanner.isEnd() && isEmailLocalChar(scanner.char())) {
		scanner.consume();
	}
	const local = scanner.sliceFrom(localStart);

	if (local.length === 0 || scanner.char() !== '@') {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(); // consume '@'

	const domainStart = scanner.position();
	while (!scanner.isEnd() && isEmailDomainChar(scanner.char())) {
		scanner.consume();
	}

	// Trim trailing '.' / '-' back out of the domain ("joe.com." → "joe.com")
	while (scanner.position() > domainStart && (scanner.charAt(-1) === '.' || scanner.charAt(-1) === '-')) {
		scanner.consume(-1);
	}

	const domain = scanner.sliceFrom(domainStart);

	// Domain must contain a dot that is not at the very start or end
	const dotIdx = domain.indexOf('.');
	if (dotIdx <= 0 || dotIdx === domain.length - 1) {
		scanner.backtrack(start);
		return null;
	}

	return autoEmail(`${local}@${domain}`);
}

function tryPhone(scanner: Scanner, prev: string): Inlines | null {
	if (prev !== '' && !isSpace(prev)) return null;

	const start = scanner.position();
	scanner.consume(); // consume '+'

	while (!scanner.isEnd() && isPhoneChar(scanner.char())) {
		scanner.consume();
	}

	const raw = scanner.sliceFrom(start); // includes the leading '+'

	let digits = '';
	for (const ch of raw) {
		if (isDigit(ch)) digits += ch;
	}

	if (digits.length < 5) {
		scanner.backtrack(start);
		return null;
	}

	return phoneChecker(raw, digits);
}

function tryTimestamp(scanner: Scanner): Inlines | null {
	const start = scanner.position();
	const delimiter = '<t:';

	const escaped = scanner.char() === '\\';
	if (escaped) scanner.consume(); // drop the backslash

	if (!scanner.matches(delimiter)) {
		scanner.backtrack(start);
		return null;
	}

	const rawStart = scanner.position();
	scanner.consume(delimiter.length); // consume '<t:'

	const contentStart = scanner.position();

	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '>') {
		scanner.consume();
	}

	if (scanner.char() !== '>') {
		scanner.backtrack(start);
		return null;
	}

	const content = scanner.sliceFrom(contentStart);

	let format: Timestamp['value']['format'] | undefined;
	let timestampValue = content;

	if (content.length >= 2 && content[content.length - 2] === ':' && 'tTdDfFR'.includes(content[content.length - 1])) {
		format = content[content.length - 1] as Timestamp['value']['format'];
		timestampValue = content.slice(0, -2);
	}

	let parsedTimestamp: string | null = null;
	let match: RegExpExecArray | null;

	if (UNIX_TIMESTAMP.test(timestampValue)) {
		parsedTimestamp = timestampValue;
	} else if ((match = ISO_TIMESTAMP_WITH_MILLISECONDS_REGEX.exec(timestampValue))) {
		parsedTimestamp = timestampFromIsoTime({
			year: match[1],
			month: match[2],
			day: match[3],
			hours: match[4],
			minutes: match[5],
			seconds: match[6],
			milliseconds: match[7],
			timezone: match[8],
		});
	} else if ((match = ISO_TIMESTAMP_REGEX.exec(timestampValue))) {
		parsedTimestamp = timestampFromIsoTime({
			year: match[1],
			month: match[2],
			day: match[3],
			hours: match[4],
			minutes: match[5],
			seconds: match[6],
			timezone: match[7],
		});
	} else if ((match = TIME_HOURS_MINUTES_SECONDS_REGEX.exec(timestampValue))) {
		parsedTimestamp = timestampFromHours(match[1], match[2], match[3], match[4]);
	} else if ((match = TIME_HOURS_MINUTES_REGEX.exec(timestampValue))) {
		parsedTimestamp = timestampFromHours(match[1], match[2], undefined, match[3]);
	}

	if (parsedTimestamp === null) {
		scanner.backtrack(start);
		return null;
	}

	scanner.consume(); // consume '>'

	if (escaped) return plain(scanner.sliceFrom(rawStart));

	return timestamp(parsedTimestamp, format, [start, scanner.position()]);
}

export function tryEmoticon(scanner: Scanner, prev: string, stopChar: string): Inlines | null {
	if (isAlphaNum(prev)) return null;

	const start = scanner.position();

	const node = matchEmoticon(scanner);
	if (node === null) return null;

	// Must be followed by whitespace, end of text, `*`, or the emphasis closer (stopChar).
	const after = scanner.char();
	const beforeCloser = stopChar !== '' && after === stopChar[0];
	if (after === '' || isSpace(after) || isNewline(after) || after === '*' || beforeCloser) {
		return node;
	}

	scanner.backtrack(start);
	return null;
}

function tryUserMention(scanner: Scanner, prev: string): Inlines | null {
	if (isAlphaNum(prev)) return null;

	const start = scanner.position();

	scanner.consume(); // consume '@'
	const nameStart = scanner.position();

	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const ch = scanner.char();
		const code = ch.charCodeAt(0);

		if (isAlphaNum(ch) || '._-:@'.includes(ch) || code > 127) {
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

	return mentionUser(name);
}

function tryChannelMention(scanner: Scanner, prev: string): Inlines | null {
	if (prev !== '' && !isSpace(prev)) return null;

	const start = scanner.position();
	scanner.consume();

	const nameStart = scanner.position();

	while (!scanner.isEnd() && !isNewline(scanner.char()) && !isSpace(scanner.char())) {
		const c = scanner.char();
		if (!isAlphaNum(c) && !'_-.'.includes(c)) break;
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
	const start = scanner.position();
	const delimiter = '||';

	if (!scanner.matches(delimiter)) {
		return null;
	}
	scanner.consume(delimiter.length); // consume opening "||"

	const content = parseInline(scanner, options, delimiter);

	if (!scanner.matches(delimiter)) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(delimiter.length); // consume closing "||"

	if (content.length === 0) {
		scanner.backtrack(start);
		return null;
	}

	return spoiler(reducePlainTexts(content) as Spoiler['value']);
}

function parseLinkLabel(scanner: Scanner, options: Options): Inlines[] {
	const nodes: Inlines[] = [];
	let prev = '';

	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		if (scanner.matches('](') || isReferenceContinuation(scanner)) break;

		const ch = scanner.char();

		if (ch === '*') {
			const r = tryBold(scanner, options);
			if (r !== null) {
				nodes.push(r);
				prev = ch;
				continue;
			}
		}
		if (ch === '~') {
			const r = tryStrike(scanner, options);
			if (r !== null) {
				nodes.push(r);
				prev = ch;
				continue;
			}
		}
		if (ch === '_') {
			const r = tryItalic(scanner, options, prev);
			if (r !== null) {
				nodes.push(...r);
				prev = scanner.previous();
				continue;
			}
		}

		if (ch === '\\') {
			const next = scanner.charAt(1);
			if (next !== '' && ESCAPABLE.has(next)) {
				nodes.push(plain(next));
				scanner.consume(2);
				prev = next;
				continue;
			}
		}

		nodes.push(plain(ch));
		prev = ch;
		scanner.consume();
	}

	return reducePlainTexts(nodes);
}

function tryMarkdownLink(scanner: Scanner, options: Options): Inlines | null {
	if (skipReferences) return null;
	const start = scanner.position();

	if (scanner.char() !== '[') {
		return null;
	}
	scanner.consume(); // consume '['

	skipReferences = true;
	const titleNodes = parseLinkLabel(scanner, options);
	skipReferences = false;

	if (!scanner.matches('](')) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(2); // consume ']('

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

	let url = scanner.sliceFrom(urlStart);
	scanner.consume(); // consume ')'

	if (url.length === 0) {
		scanner.backtrack(start);
		return null;
	}

	// A phone number in the URL position becomes a tel: link.
	if (url[0] === '+') {
		let digits = '';
		for (const ch of url) {
			if (isDigit(ch)) digits += ch;
		}
		if (digits.length >= 5) {
			url = `tel:${digits}`;
		}
	}

	// "[text](/foo)" is not a link — a target needs a scheme ("https:") or a domain ("rocket.chat")
	const host = url.split('/')[0];
	if (!host.includes(':') && !host.includes('.')) {
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
	scanner.consume(); // consume '<'

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
	scanner.consume(); // consume '|'

	const titleStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== '>') {
		scanner.consume();
	}

	if (scanner.char() !== '>') {
		scanner.backtrack(start);
		return null;
	}

	const title = scanner.sliceFrom(titleStart);
	scanner.consume(); // consume '>'

	return link(url, [plain(title)]);
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

	// Inline katex: no newlines allowed inside
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

function tryAutoLinkUrl(scanner: Scanner, options: Options, prev: string): Inlines | null {
	if (prev === '_') return null;

	const ch = scanner.char();
	if (!isAlphaNum(ch)) return null;

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

	// e.g. "rocket.chat." → "rocket.chat"
	let url = token;
	while (url.length > 0 && '.,!;:)'.includes(url[url.length - 1])) {
		url = url.slice(0, -1);
	}

	if (url.length === 0 || !isValidUrlStructure(url)) {
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
	scanner.consume(); // consume opening ':'

	const nameStart = scanner.position();
	while (!scanner.isEnd() && isShortCodeChar(scanner.char())) {
		scanner.consume();
	}

	const name = scanner.sliceFrom(nameStart);
	if (name.length === 0 || scanner.char() !== ':') {
		scanner.backtrack(start);
		return null;
	}

	scanner.consume(); // consume closing ':'
	return emoji(name);
}

function tryUnicodeEmoji(scanner: Scanner): Inlines | null {
	const ch = scanner.char();

	// fast-reject plain ASCII, but keycap bases (#, *, 0-9) can start an emoji
	const isKeycapBase = (ch === '#' || ch === '*' || (ch >= '0' && ch <= '9')) && scanner.charAt(1) === '\uFE0F';
	if (ch.charCodeAt(0) <= 127 && !isKeycapBase) return null;

	let window = '';
	for (let i = 0; i < 32; i++) {
		const c = scanner.charAt(i);
		if (c === '') break;
		window += c;
	}

	const m = UNICODE_EMOJI.exec(window);
	if (m === null) return null;

	scanner.consume(m[0].length);
	return emojiUnicode(m[0]);
}

function tryColor(scanner: Scanner, options: Options): Inlines | null {
	if (!options.colors) return null;
	const delimiter = 'color:#';

	if (!scanner.matches(delimiter)) return null;

	const startPos = scanner.position();
	scanner.consume(delimiter.length); // consume "color:#"

	const hexStart = scanner.position();
	while (!scanner.isEnd() && isHexDigit(scanner.char())) {
		scanner.consume();
	}
	const hex = scanner.sliceFrom(hexStart);

	let rgba: [number, number, number, number] | null = null;

	if (hex.length === 6 || hex.length === 8) {
		// byte pairs: c7 -> 0xc7
		const b: number[] = [];
		for (let i = 0; i < hex.length; i += 2) b.push(parseInt(hex.slice(i, i + 2), 16));
		rgba = [b[0], b[1], b[2], b[3] ?? 255];
	} else if (hex.length === 3 || hex.length === 4) {
		// single nibbles doubled: c -> cc -> 0xcc
		const n: number[] = [];
		for (let i = 0; i < hex.length; i++) n.push(parseInt(hex[i] + hex[i], 16));
		rgba = [n[0], n[1], n[2], n[3] ?? 255];
	}

	if (rgba === null || isAnyText(scanner.char())) {
		scanner.backtrack(startPos);
		return null;
	}

	return color(rgba[0], rgba[1], rgba[2], rgba[3]);
}

function tryImage(scanner: Scanner): Inlines | null {
	const start = scanner.position();

	if (!scanner.matches('![')) return null;
	scanner.consume(2); // consume '!['

	const titleStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char()) && scanner.char() !== ']') {
		scanner.consume();
	}
	const title = scanner.sliceFrom(titleStart);

	if (!scanner.matches('](')) {
		scanner.backtrack(start);
		return null;
	}
	scanner.consume(2); // consume ']('

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

	if (scanner.char() !== ')') {
		scanner.backtrack(start);
		return null;
	}
	const href = scanner.sliceFrom(urlStart);
	scanner.consume(); // consume ')'

	if (href.length === 0) {
		scanner.backtrack(start);
		return null;
	}

	return title.length > 0 ? image(href, plain(title)) : image(href);
}

// ─── Block methods ──────────────────────────────────────────────────────────────

function tryCodeFence(scanner: Scanner): Code | null {
	const start = scanner.position();
	const fence = '```';

	if (!scanner.matches(fence)) {
		return null;
	}
	scanner.consume(fence.length);

	// Optional language tag
	const langStart = scanner.position();
	while (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.consume();
	}
	const language = scanner.sliceFrom(langStart).trim();

	// Must be followed by newline
	if (scanner.isEnd()) {
		scanner.backtrack(start);
		return null;
	}

	consumeEndOfLine(scanner); // Consume newline after opening ```

	const lines: CodeLine[] = [];
	let closed = false;

	while (!scanner.isEnd()) {
		if (scanner.matches(fence)) {
			scanner.consume(fence.length);
			while (isSpace(scanner.char())) scanner.consume(); // allow trailing spaces; keep other text
			closed = true;
			break;
		}

		const lineStart = scanner.position();
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.consume();
		}

		const text = scanner.sliceFrom(lineStart);
		lines.push(codeLine(plain(text)));

		consumeEndOfLine(scanner);
	}

	if (!closed) {
		scanner.backtrack(start);
		return null;
	}

	return code(lines, language || undefined);
}

function tryHeading(scanner: Scanner, options: Options): Heading | null {
	const start = scanner.position();
	let level = 0; // Count # characters (max 4)

	while (level < 4 && scanner.char() === '#') {
		scanner.consume();
		level++;
	}

	if (level === 0) {
		scanner.backtrack(start);
		return null;
	}

	// Must be followed by at least one space or tab
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

	const paragraphs: Paragraph[] = [];
	let hasContent = false;

	while (!scanner.isEnd() && scanner.char() === '>') {
		scanner.consume(); // consume '>'

		// Optional space/tab after '>'
		if (isSpace(scanner.char())) {
			scanner.consume();
		}

		if (scanner.isEnd() || isNewline(scanner.char())) {
			paragraphs.push(paragraph([plain('')])); // empty quoted line
		} else {
			const inlines = parseInline(scanner, options);
			paragraphs.push(paragraph(inlines));
			hasContent = true;
		}

		consumeEndOfLine(scanner); // Consume newline
	}

	if (paragraphs.length === 0 || !hasContent) {
		scanner.backtrack(start);
		return null;
	}

	return quote(paragraphs);
}

function tryBlockSpoiler(scanner: Scanner, options: Options): SpoilerBlock | null {
	const start = scanner.position();
	const spoiler = '||';

	// Opening line must be exactly "||"
	if (!scanner.matches(spoiler)) {
		return null;
	}
	scanner.consume(spoiler.length);

	if (scanner.isEnd() || !isNewline(scanner.char())) {
		scanner.backtrack(start); // "||" not alone on its line, or at EOF
		return null;
	}
	consumeEndOfLine(scanner);

	const paragraphs: Paragraph[] = [];
	let closed = false;

	while (!scanner.isEnd()) {
		if (scanner.matches(spoiler)) {
			const closingPos = scanner.position();
			scanner.consume(spoiler.length);

			if (scanner.isEnd() || isNewline(scanner.char())) {
				closed = true;
				break;
			}
			scanner.backtrack(closingPos); // not a closing line → treat as content
		}

		const inlines = parseInline(scanner, options);
		paragraphs.push(paragraph(inlines));
		consumeEndOfLine(scanner);
	}

	if (!closed || paragraphs.length === 0) {
		scanner.backtrack(start);
		return null;
	}

	return spoilerBlock(paragraphs);
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

	const items: ListItem[] = [];

	while (!scanner.isEnd()) {
		const ch = scanner.char();
		const itemStart = scanner.position();

		if (ch !== marker) break;
		if (!isSpace(scanner.charAt(1))) break;

		scanner.consume(); // consume marker

		while (isSpace(scanner.char())) {
			scanner.consume();
		}

		const inlines = parseInline(scanner, options);

		// '*' is also the bold marker, so "* " or text ending in '*' is bold, not a list
		if (marker === '*') {
			const last = inlines[inlines.length - 1];
			const isEmpty = inlines.length === 0;
			const endsWithStar = last?.type === 'PLAIN_TEXT' && last.value.endsWith('*');

			if (isEmpty || endsWithStar) {
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

	const items: ListItem[] = [];

	while (!scanner.isEnd()) {
		if (!isDigit(scanner.char())) break;

		// Collect leading digits
		const numStart = scanner.position();
		while (!scanner.isEnd() && isDigit(scanner.char())) {
			scanner.consume();
		}
		const numStr = scanner.sliceFrom(numStart);

		if (scanner.char() !== '.') {
			if (items.length > 0) {
				scanner.backtrack(numStart);
				break;
			}
			scanner.backtrack(start);
			return null;
		}
		scanner.consume(); // consume '.'

		if (!isSpace(scanner.char())) {
			if (items.length > 0) {
				scanner.backtrack(numStart);
				break;
			}
			scanner.backtrack(start);
			return null;
		}

		while (isSpace(scanner.char())) {
			scanner.consume();
		}

		const inlines = parseInline(scanner, options);
		items.push(listItem(inlines, parseInt(numStr)));

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
		if (node === null) {
			node = tryUnicodeEmoji(scanner);
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

function tryTasks(scanner: Scanner, options: Options): Tasks | null {
	const start = scanner.position();
	const items: Task[] = [];
	const delimiter = '- [';

	while (scanner.matches(delimiter)) {
		const lineStart = scanner.position();
		scanner.consume(delimiter.length); // consume '- ['

		const flag = scanner.char();
		if (flag !== 'x' && flag !== ' ') {
			scanner.backtrack(lineStart);
			break;
		}
		scanner.consume(); // consume the flag

		if (scanner.char() !== ']') {
			scanner.backtrack(lineStart);
			break;
		}
		scanner.consume(); // consume ']'

		if (!isSpace(scanner.char())) {
			scanner.backtrack(lineStart);
			break;
		}
		while (isSpace(scanner.char())) scanner.consume();

		const inlines = parseInline(scanner, options);
		items.push(task(inlines, flag === 'x'));

		consumeEndOfLine(scanner);
	}

	if (items.length === 0) {
		scanner.backtrack(start);
		return null;
	}

	return tasks(items);
}

function tryHorizontalRule(scanner: Scanner): HorizontalRule | null {
	const start = scanner.position();

	while (isSpace(scanner.char())) scanner.consume(); // leading spaces/tabs

	// Need at least three dashes — nothing else counts as a rule.
	const dashStart = scanner.position();
	while (scanner.char() === '-') scanner.consume();
	const dashEnd = scanner.position();
	if (dashEnd - dashStart < 3) {
		scanner.backtrack(start);
		return null;
	}

	while (isSpace(scanner.char())) scanner.consume(); // trailing spaces/tabs

	// The rest of the line must be empty.
	if (!scanner.isEnd() && !isNewline(scanner.char())) {
		scanner.backtrack(start);
		return null;
	}

	consumeEndOfLine(scanner);
	return horizontalRule([dashStart, dashEnd]);
}

// ------------- Table -----------------------------------------------------------------------

function cellAlignment(hasLeftColon: boolean, hasRightColon: boolean): TableCellAlignment {
	if (hasLeftColon && hasRightColon) return 'center';
	if (hasRightColon) return 'right';
	if (hasLeftColon) return 'left';
	return undefined;
}

// One table row "| a | b |" → its cells, or null if not a valid row.
function parseTableRow(scanner: Scanner, options: Options): Inlines[][] | null {
	const start = scanner.position();
	if (scanner.char() !== '|') return null;
	scanner.consume(); // opening '|'

	const cells: Inlines[][] = [];
	while (true) {
		// Collect raw cell text up to an unescaped '|' or end of line.
		let text = '';
		let closed = false;
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			if (scanner.char() === '\\' && scanner.charAt(1) === '|') {
				text += '|'; // escaped pipe stays literal
				scanner.consume(2);
				continue;
			}
			if (scanner.char() === '|') {
				closed = true;
				break;
			}
			text += scanner.char();
			scanner.consume();
		}

		if (!closed) {
			scanner.backtrack(start); // no closing '|' -> not a valid row
			return null;
		}
		scanner.consume(); // consume '|'

		cells.push(parseInline(new Scanner(text), options));

		if (scanner.isEnd() || isNewline(scanner.char())) break; // trailing '|' reached
	}

	consumeEndOfLine(scanner);
	return cells;
}

// The separator line "| --- | :--: |" → each column's alignment, or null.
function parseTableDelimiter(scanner: Scanner): TableCellAlignment[] | null {
	const start = scanner.position();
	if (scanner.char() !== '|') return null;
	scanner.consume();

	const aligns: TableCellAlignment[] = [];
	while (true) {
		while (isSpace(scanner.char())) scanner.consume();

		const left = scanner.char() === ':';
		if (left) scanner.consume();

		let dashes = 0;
		while (scanner.char() === '-') {
			scanner.consume();
			dashes++;
		}
		if (dashes === 0) {
			scanner.backtrack(start);
			return null;
		}

		const right = scanner.char() === ':';
		if (right) scanner.consume();

		while (isSpace(scanner.char())) scanner.consume();
		if (scanner.char() !== '|') {
			scanner.backtrack(start);
			return null;
		}
		scanner.consume(); // consume '|'

		aligns.push(cellAlignment(left, right));

		if (scanner.isEnd() || isNewline(scanner.char())) break;
	}

	consumeEndOfLine(scanner);
	return aligns;
}

function tryTable(scanner: Scanner, options: Options): Table | null {
	const start = scanner.position();

	const header = parseTableRow(scanner, options);
	if (header === null) return null;

	const aligns = parseTableDelimiter(scanner);
	if (aligns === null) {
		scanner.backtrack(start); // a header row with no delimiter row isn't a table
		return null;
	}

	const rows: Inlines[][][] = [];
	while (true) {
		const row = parseTableRow(scanner, options);
		if (row === null) break;
		rows.push(row);
	}

	return table(header, aligns, rows, [start, scanner.position()]);
}
