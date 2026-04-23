import type { Root, Paragraph, Blocks, Inlines, Plain } from '../definitions';
import type { Token } from '../lexer';
import { TokenKind } from '../lexer';
import { TokenStream } from './TokenStream';
import type { ParserOptions } from './ParserOptions';
import {
	paragraph,
	plain,
	lineBreak,
	reducePlainTexts,
	heading,
	mentionChannel,
	code,
	codeLine,
	quote,
	bold,
	orderedList,
	unorderedList,
	listItem,
	emoji,
	tasks,
	task,
	mentionUser,
	link,
} from '../utils';

/**
 * Maximum recursion depth to prevent stack overflow on crafted input.
 * This complements the lexer's MAX_TOKENS cap.
 */
const MAX_DEPTH = 100;

/**
 * Recursive-descent parser that consumes a flat `Token[]` stream (produced by
 * the handwritten lexer) and builds the same `Root` AST that the legacy PEG
 * parser produces.
 *
 * ### Design notes
 * - The parser is stateless across calls — each `parse()` invocation creates
 *   a fresh `TokenStream` and produces a new `Root`.
 * - Block-level rules are tried first at each line boundary; if none match,
 *   the line is wrapped in a `Paragraph`.
 * - Inline parsing is handled by `parseInlines()`, which delegates to
 *   specialised methods for emphasis, links, code spans, etc. (added in
 *   later phases).
 */
export class Parser {
	private readonly _stream: TokenStream;
	private readonly _options: ParserOptions;
	private _depth = 0;

	constructor(tokens: Token[], options: ParserOptions) {
		this._stream = new TokenStream(tokens);
		this._options = options;
	}

	// ── public API ───────────────────────────────────────────────────────

	/**
	 * Parses the full token stream and returns the `Root` AST.
	 *
	 * The top-level loop alternates between:
	 * 1. Trying block-level constructs (heading, code fence, blockquote, list, etc.)
	 * 2. Falling back to paragraph parsing for inline content
	 */
	parse(): Root {
		void this._options;
		const blocks: Array<Paragraph | Blocks> = [];

		while (!this._stream.isEOF()) {
			if (this._stream.at(TokenKind.NEWLINE)) {
				const newlineCount = this._consumeNewlines();

				// Leading newlines do not produce nodes.
				if (blocks.length === 0) {
					continue;
				}

				if (this._stream.isEOF()) {
					const previous = blocks[blocks.length - 1];
					if (previous?.type === 'HEADING' && newlineCount >= 1) {
						blocks.push(lineBreak());
					}
					continue;
				}

				// Between blocks, N newlines become N-1 LINE_BREAK nodes.
				for (let index = 1; index < newlineCount; index++) {
					blocks.push(lineBreak());
				}

				continue;
			}

			// Try block-level rules (Phase 2 will populate this).
			const block = this._tryBlock();
			if (block !== null) {
				blocks.push(block);
				continue;
			}

			// Fallback: parse a paragraph.
			blocks.push(this.parseParagraph());
		}

		// Empty input → single paragraph with empty plain text.
		if (blocks.length === 0) {
			blocks.push(paragraph([plain('')]));
		}

		return blocks as Root;
	}

	// ── block-level rules ────────────────────────────────────────────────

	/**
	 * Attempts to parse a block-level construct at the current stream
	 * position. Returns `null` if no block rule matches.
	 *
	 * Stub — Phase 2 will add heading, code fence, blockquote, list,
	 * task list, KaTeX block, and spoiler block rules here.
	 */
	private _tryBlock(): Blocks | null {
		if (!this._stream.isLineStart()) {
			return null;
		}

		if (this._stream.at(TokenKind.TRIPLE_BACKTICK)) {
			return this._parseCodeFence();
		}

		if (this._stream.at(TokenKind.BLOCKQUOTE_MARKER)) {
			return this._parseBlockquote();
		}

		if (this._stream.at(TokenKind.OL_BULLET)) {
			return this._parseOrderedList();
		}

		if (this._stream.at(TokenKind.TASK_BULLET)) {
			return this._parseTasks();
		}

		if (this._stream.at(TokenKind.UL_BULLET)) {
			return this._parseUnorderedList();
		}

		if (this._stream.at(TokenKind.HEADING_MARKER)) {
			return this._parseHeading();
		}

		return null;
	}

	private _parseHeading(): Blocks {
		const marker = this._stream.expect(TokenKind.HEADING_MARKER);

		// Lexer guarantees heading marker is followed by one space/tab delimiter.
		if (this._stream.at(TokenKind.WHITESPACE)) {
			this._stream.advance();
		}

		const content = this._parsePlainTexts(new Set([TokenKind.NEWLINE, TokenKind.EOF]));

		return heading(content, Number(marker.value) as 1 | 2 | 3 | 4);
	}

	private _parseCodeFence(): Blocks | null {
		const start = this._stream.mark();
		this._stream.advance(); // opening TRIPLE_BACKTICK

		if (!this._stream.at(TokenKind.CODE_CONTENT)) {
			this._stream.reset(start);
			return null;
		}

		const content = this._stream.advance().value;

		let language: string | undefined;
		let body = content;
		const firstNewline = content.indexOf('\n');

		if (firstNewline !== -1) {
			const languageCandidate = content.slice(0, firstNewline).trim();
			language = languageCandidate.length > 0 ? languageCandidate : undefined;
			body = content.slice(firstNewline + 1);
		}

		if (body.endsWith('\n')) {
			body = body.slice(0, -1);
		}

		const lines = body.split('\n').map((line) => codeLine(plain(line)));

		if (this._stream.at(TokenKind.TRIPLE_BACKTICK)) {
			this._stream.advance();
		}

		return code(lines, language);
	}

	private _parseBlockquote(): Blocks {
		const paragraphs: Paragraph[] = [];

		while (this._stream.isLineStart() && this._stream.at(TokenKind.BLOCKQUOTE_MARKER)) {
			this._stream.advance();

			if (this._stream.at(TokenKind.WHITESPACE)) {
				this._stream.advance();
			}

			const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));
			paragraphs.push(paragraph(inlines.length > 0 ? reducePlainTexts(inlines) : [plain('')]));

			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
			}
		}

		return quote(paragraphs);
	}

	private _parseOrderedList(): Blocks {
		const items = [] as ReturnType<typeof listItem>[];

		while (this._stream.isLineStart() && this._stream.at(TokenKind.OL_BULLET)) {
			const bullet = this._stream.advance();
			const number = Number.parseInt(bullet.value, 10);
			const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));
			items.push(listItem(inlines.length > 0 ? reducePlainTexts(inlines) : [plain('')], number));

			const newlineMark = this._stream.mark();
			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
			}

			if (!(this._stream.isLineStart() && this._stream.at(TokenKind.OL_BULLET))) {
				this._stream.reset(newlineMark);
				break;
			}
		}

		return orderedList(items);
	}

	private _parseUnorderedList(): Blocks {
		const items = [] as ReturnType<typeof listItem>[];
		const marker = this._stream.peek().value;

		while (this._stream.isLineStart() && this._stream.at(TokenKind.UL_BULLET) && this._stream.peek().value === marker) {
			this._stream.advance();
			const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));
			items.push(listItem(inlines.length > 0 ? reducePlainTexts(inlines) : [plain('')]));

			const newlineMark = this._stream.mark();
			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
			}

			if (!(this._stream.isLineStart() && this._stream.at(TokenKind.UL_BULLET) && this._stream.peek().value === marker)) {
				this._stream.reset(newlineMark);
				break;
			}
		}

		return unorderedList(items);
	}

	private _parseTasks(): Blocks {
		const items = [] as ReturnType<typeof task>[];

		while (this._stream.isLineStart() && this._stream.at(TokenKind.TASK_BULLET)) {
			const bullet = this._stream.advance();
			const checked = bullet.value === 'x';
			const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));
			items.push(task(inlines.length > 0 ? reducePlainTexts(inlines) : [plain('')], checked));

			const newlineMark = this._stream.mark();
			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
			}

			if (!(this._stream.isLineStart() && this._stream.at(TokenKind.TASK_BULLET))) {
				this._stream.reset(newlineMark);
				break;
			}
		}

		return tasks(items);
	}

	// ── paragraph ────────────────────────────────────────────────────────

	/**
	 * Parses a single paragraph: collects inline content up to the next
	 * double-newline, EOF, or block-level token at line-start.
	 *
	 * Line breaks within a paragraph produce `LineBreak` nodes.
	 */
	private parseParagraph(): Paragraph {
		const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));

		if (inlines.length === 0) {
			return paragraph([plain('')]);
		}

		return paragraph(reducePlainTexts(inlines));
	}

	// ── inline parsing ───────────────────────────────────────────────────

	/**
	 * Parses a single inline element from the current position.
	 *
	 * Stub — currently only handles `TEXT`, `WHITESPACE`, and `ESCAPED`
	 * tokens as plain text. Phases 3–4 will add emphasis, links, code
	 * spans, emoji, mentions, timestamps, colors, and KaTeX.
	 */
	private parseInlines(stopKinds: ReadonlySet<TokenKind>): Inlines[] {
		const inlines: Inlines[] = [];

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				break;
			}

			switch (token.kind) {
				case TokenKind.ASTERISK: {
					const parsedBold = this._parseAsteriskBold(stopKinds);
					if (parsedBold !== null) {
						inlines.push(parsedBold);
						break;
					}

					this._stream.advance();
					inlines.push(plain(token.raw));
					break;
				}

				case TokenKind.TEXT:
				case TokenKind.WHITESPACE:
				case TokenKind.ESCAPED:
					this._stream.advance();
					inlines.push(plain(token.value));
					break;

				case TokenKind.MENTION_CHANNEL:
					this._stream.advance();
					inlines.push(mentionChannel(token.value));
					break;

				case TokenKind.MENTION_USER:
					this._stream.advance();
					inlines.push(mentionUser(token.value));
					break;

				case TokenKind.LINK_OPEN: {
					const parsedLink = this._parseMarkdownLink(stopKinds);
					if (parsedLink !== null) {
						inlines.push(parsedLink);
						break;
					}

					this._stream.advance();
					inlines.push(plain(token.raw));
					break;
				}

				case TokenKind.EMOJI_SHORTCODE:
					this._stream.advance();
					inlines.push(emoji(token.value));
					break;

				default:
					// Preserve forward progress until richer inline handlers land.
					this._stream.advance();
					inlines.push(plain(token.raw));
			}
		}

		return inlines;
	}

	private _parseAsteriskBold(stopKinds: ReadonlySet<TokenKind>): Inlines | null {
		const start = this._stream.mark();
		const opener = this._stream.peek();

		if (opener.kind !== TokenKind.ASTERISK || (opener.value !== '*' && opener.value !== '**')) {
			return null;
		}

		const delimiter = opener.value;

		this._stream.advance();
		const content: Inlines[] = [];

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				this._stream.reset(start);
				return null;
			}

			if (token.kind === TokenKind.ASTERISK && token.value === delimiter) {
				this._stream.advance();
				const reduced = reducePlainTexts(content);
				return bold((reduced.length > 0 ? reduced : [plain('')]) as any);
			}

			this._stream.advance();
			switch (token.kind) {
				case TokenKind.TEXT:
				case TokenKind.WHITESPACE:
				case TokenKind.ESCAPED:
					content.push(plain(token.value));
					break;
				case TokenKind.MENTION_CHANNEL:
					content.push(mentionChannel(token.value));
					break;
				default:
					content.push(plain(token.raw));
			}
		}

		this._stream.reset(start);
		return null;
	}

	private _parseMarkdownLink(stopKinds: ReadonlySet<TokenKind>): Inlines | null {
		const start = this._stream.mark();

		if (!this._stream.at(TokenKind.LINK_OPEN)) {
			return null;
		}

		this._stream.advance();
		const label: Inlines[] = [];

		while (!this._stream.isEOF() && !this._stream.at(TokenKind.LINK_HREF_OPEN)) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				this._stream.reset(start);
				return null;
			}

			this._stream.advance();
			switch (token.kind) {
				case TokenKind.TEXT:
				case TokenKind.WHITESPACE:
				case TokenKind.ESCAPED:
					label.push(plain(token.value));
					break;
				case TokenKind.MENTION_CHANNEL:
					label.push(mentionChannel(token.value));
					break;
				case TokenKind.MENTION_USER:
					label.push(mentionUser(token.value));
					break;
				case TokenKind.EMOJI_SHORTCODE:
					label.push(emoji(token.value));
					break;
				default:
					label.push(plain(token.raw));
			}
		}

		if (!this._stream.at(TokenKind.LINK_HREF_OPEN)) {
			this._stream.reset(start);
			return null;
		}

		this._stream.advance();
		let href = '';

		while (!this._stream.isEOF() && !this._stream.at(TokenKind.LINK_HREF_CLOSE)) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				this._stream.reset(start);
				return null;
			}

			this._stream.advance();
			href += token.value;
		}

		if (!this._stream.at(TokenKind.LINK_HREF_CLOSE)) {
			this._stream.reset(start);
			return null;
		}

		this._stream.advance();
		const reduced = reducePlainTexts(label);
		return link(href, (reduced.length > 0 ? reduced : [plain('')]) as any);
	}

	// ── helpers ──────────────────────────────────────────────────────────

	private _consumeNewlines(): number {
		let count = 0;

		while (this._stream.at(TokenKind.NEWLINE)) {
			this._stream.advance();
			count++;
		}

		return count;
	}

	private _parsePlainTexts(stopKinds: ReadonlySet<TokenKind>): Plain[] {
		const chunks: Plain[] = [];

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				break;
			}

			this._stream.advance();

			switch (token.kind) {
				case TokenKind.TEXT:
				case TokenKind.WHITESPACE:
				case TokenKind.ESCAPED:
					chunks.push(plain(token.value));
					break;
				default:
					chunks.push(plain(token.raw));
			}
		}

		return reducePlainTexts(chunks) as Plain[];
	}

	/**
	 * Guards against runaway recursion by incrementing a depth counter.
	 * Must be paired with `_leaveRecursion()`.
	 * @returns `true` if the recursion limit has been exceeded.
	 */
	protected _enterRecursion(): boolean {
		this._depth++;
		return this._depth > MAX_DEPTH;
	}

	/** Decrements the recursion depth counter. */
	protected _leaveRecursion(): void {
		this._depth--;
	}
}
