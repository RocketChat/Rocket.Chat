import type { Root, Paragraph, Blocks, Inlines, Plain } from '../definitions';
import type { Token } from '../lexer';
import { TokenKind } from '../lexer';
import { TokenStream } from './TokenStream';
import type { ParserOptions } from './ParserOptions';
import { paragraph, plain, lineBreak, reducePlainTexts } from '../utils';

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
		const blocks: Array<Paragraph | Blocks> = [];

		while (!this._stream.isEOF()) {
			// Skip bare newlines between blocks (they become line-breaks
			// only when they appear *inside* a paragraph).
			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
				continue;
			}

			// Try block-level rules (Phase 2 will populate this).
			const block = this._tryBlock();
			if (block !== null) {
				blocks.push(block);
				continue;
			}

			// Fallback: parse a paragraph.
			blocks.push(this._parseParagraph());
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
		// Phase 2 will implement block-level dispatch here.
		return null;
	}

	// ── paragraph ────────────────────────────────────────────────────────

	/**
	 * Parses a single paragraph: collects inline content up to the next
	 * double-newline, EOF, or block-level token at line-start.
	 *
	 * Line breaks within a paragraph produce `LineBreak` nodes.
	 */
	private _parseParagraph(): Paragraph {
		const inlines: Paragraph['value'] = [];

		while (!this._stream.isEOF()) {
			// A newline could be a line break within the paragraph or a
			// paragraph separator (double newline / block start).
			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();

				// Double newline or EOF → end of paragraph.
				if (this._stream.isEOF() || this._stream.at(TokenKind.NEWLINE)) {
					break;
				}

				// Check if the next line starts a block construct.
				if (this._isBlockStart()) {
					break;
				}

				// Single newline inside paragraph → line break.
				inlines.push(lineBreak());
				continue;
			}

			// Collect inline content.
			const inline = this._parseInline();
			if (inline !== null) {
				inlines.push(inline);
			}
		}

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
	private _parseInline(): Inlines | null {
		const token = this._stream.peek();

		switch (token.kind) {
			case TokenKind.TEXT:
			case TokenKind.WHITESPACE:
				this._stream.advance();
				return plain(token.value);

			case TokenKind.ESCAPED:
				this._stream.advance();
				return plain(token.value);

			case TokenKind.EOF:
				return null;

			default:
				// Unknown/unhandled token kinds → consume as plain text
				// so the parser never gets stuck.
				this._stream.advance();
				return plain(token.raw);
		}
	}

	// ── helpers ──────────────────────────────────────────────────────────

	/**
	 * Returns `true` when the current token could start a block-level
	 * construct. Used to break out of paragraph parsing.
	 *
	 * Stub — Phase 2 will check for HEADING_MARKER, TRIPLE_BACKTICK,
	 * BLOCKQUOTE_MARKER, UL_BULLET, OL_BULLET, TASK_BULLET,
	 * KATEX_BLOCK_START, and BLOCK_SPOILER_FENCE.
	 */
	private _isBlockStart(): boolean {
		if (!this._stream.isLineStart()) {
			return false;
		}

		const kind = this._stream.peek().kind;

		switch (kind) {
			case TokenKind.HEADING_MARKER:
			case TokenKind.TRIPLE_BACKTICK:
			case TokenKind.BLOCKQUOTE_MARKER:
			case TokenKind.UL_BULLET:
			case TokenKind.OL_BULLET:
			case TokenKind.TASK_BULLET:
			case TokenKind.KATEX_BLOCK_START:
			case TokenKind.BLOCK_SPOILER_FENCE:
				return true;
			default:
				return false;
		}
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
