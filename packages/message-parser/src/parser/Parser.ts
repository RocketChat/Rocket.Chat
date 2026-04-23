import type { Root, Paragraph, Blocks, Inlines, Plain } from '../definitions';
import type { Token } from '../lexer';
import { TokenKind } from '../lexer';
import { TokenStream } from './TokenStream';
import type { ParserOptions } from './ParserOptions';
import { paragraph, plain, lineBreak, reducePlainTexts, heading, mentionChannel } from '../utils';

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

				default:
					// Preserve forward progress until richer inline handlers land.
					this._stream.advance();
					inlines.push(plain(token.raw));
			}
		}

		return inlines;
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
