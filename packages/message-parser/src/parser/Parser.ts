import type { Root, Paragraph, Blocks, Inlines, Plain, Emoji } from '../definitions';
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
	emojiUnicode,
	bigEmoji,
	katex,
	inlineKatex,
	spoilerBlock,
	tasks,
	task,
	mentionUser,
	link,
} from '../utils';

// Safety guard against runaway recursion.
const MAX_DEPTH = 100;

export class Parser {
	private readonly _stream: TokenStream;
	private readonly _options: ParserOptions;
	private _depth = 0;

	constructor(tokens: Token[], options: ParserOptions) {
		this._stream = new TokenStream(tokens);
		this._options = options;
	}

	parse(): Root {
		void this._options;

		const bigEmojiRoot = this._tryParseBigEmojiRoot();
		if (bigEmojiRoot !== null) {
			return bigEmojiRoot;
		}

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

				const previous = blocks[blocks.length - 1];
				if (previous?.type === 'SPOILER_BLOCK' && newlineCount === 1) {
					blocks.push(lineBreak());
					continue;
				}

				// Between blocks, N newlines become N-1 LINE_BREAK nodes.
				for (let index = 1; index < newlineCount; index++) {
					blocks.push(lineBreak());
				}

				continue;
			}

			// Block first, paragraph fallback second.
			const block = this._tryBlock();
			if (block !== null) {
				blocks.push(block);
				continue;
			}

			blocks.push(this.parseParagraph());
		}

		// Keep behavior consistent with the legacy parser for empty input.
		if (blocks.length === 0) {
			blocks.push(paragraph([plain('')]));
		}

		return blocks as Root;
	}

	private _tryBlock(): Blocks | null {
		if (!this._stream.isLineStart()) {
			return null;
		}

		if (this._stream.at(TokenKind.TRIPLE_BACKTICK)) {
			return this._parseCodeFence();
		}

		if (this._stream.at(TokenKind.KATEX_BLOCK_START)) {
			return this._parseKatexBlock();
		}

		if (this._stream.at(TokenKind.BLOCK_SPOILER_FENCE)) {
			return this._parseSpoilerBlock();
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

		if (this._stream.at(TokenKind.WHITESPACE)) {
			this._stream.advance();
		}

		const content = this._parsePlainTexts(new Set([TokenKind.NEWLINE, TokenKind.EOF]));

		return heading(content, Number(marker.value) as 1 | 2 | 3 | 4);
	}

	private _parseCodeFence(): Blocks | null {
		const start = this._stream.mark();
		this._stream.advance();

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

	private _parseKatexBlock(): Blocks {
		this._stream.advance();
		let content = '';

		while (!this._stream.isEOF() && !this._stream.at(TokenKind.KATEX_BLOCK_END)) {
			content += this._stream.advance().raw;
		}

		if (this._stream.at(TokenKind.KATEX_BLOCK_END)) {
			this._stream.advance();
		}

		return katex(content);
	}

	private _parseSpoilerBlock(): Blocks {
		this._stream.advance();

		if (this._stream.at(TokenKind.NEWLINE)) {
			this._stream.advance();
		}

		const paragraphs: Paragraph[] = [];

		while (!this._stream.isEOF()) {
			if (this._stream.isLineStart() && this._stream.at(TokenKind.BLOCK_SPOILER_FENCE)) {
				this._stream.advance();
				break;
			}

			const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));
			paragraphs.push(paragraph(inlines.length > 0 ? reducePlainTexts(inlines) : [plain('')]));

			if (this._stream.at(TokenKind.NEWLINE)) {
				this._stream.advance();
			}
		}

		if (paragraphs.length === 0) {
			paragraphs.push(paragraph([plain('')]));
		}

		return spoilerBlock(paragraphs);
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

	private parseParagraph(): Paragraph {
		const inlines = this.parseInlines(new Set([TokenKind.NEWLINE, TokenKind.EOF]));

		if (inlines.length === 0) {
			return paragraph([plain('')]);
		}

		return paragraph(reducePlainTexts(inlines));
	}

	private parseInlines(stopKinds: ReadonlySet<TokenKind>): Inlines[] {
		const inlines: Inlines[] = [];

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			if (stopKinds.has(token.kind)) {
				break;
			}

			switch (token.kind) {
				case TokenKind.KATEX_INLINE_START: {
					const parsedInlineKatex = this._parseInlineKatex(stopKinds);
					if (parsedInlineKatex !== null) {
						inlines.push(parsedInlineKatex);
						break;
					}

					this._stream.advance();
					inlines.push(plain(token.raw));
					break;
				}

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

				case TokenKind.EMOJI_UNICODE:
					this._stream.advance();
					inlines.push(emojiUnicode(token.value));
					break;

				default:
					this._stream.advance();
					inlines.push(plain(token.raw));
			}
		}

		return inlines;
	}

	private _tryParseBigEmojiRoot(): Root | null {
		const start = this._stream.mark();
		const emojis: Emoji[] = [];

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			switch (token.kind) {
				case TokenKind.EMOJI_SHORTCODE:
					this._stream.advance();
					emojis.push(emoji(token.value));
					break;

				case TokenKind.EMOJI_UNICODE:
					this._stream.advance();
					emojis.push(emojiUnicode(token.value));
					break;

				case TokenKind.WHITESPACE:
				case TokenKind.NEWLINE:
					this._stream.advance();
					break;

				default:
					this._stream.reset(start);
					return null;
			}
		}

		if (emojis.length >= 1 && emojis.length <= 3) {
			return [bigEmoji(emojis as [Emoji] | [Emoji, Emoji] | [Emoji, Emoji, Emoji])];
		}

		this._stream.reset(start);
		return null;
	}

	private _parseInlineKatex(stopKinds: ReadonlySet<TokenKind>): Inlines | null {
		const start = this._stream.mark();

		if (!this._stream.at(TokenKind.KATEX_INLINE_START)) {
			return null;
		}

		this._stream.advance();
		let content = '';

		while (!this._stream.isEOF()) {
			const token = this._stream.peek();

			if (token.kind === TokenKind.KATEX_INLINE_END) {
				this._stream.advance();
				return inlineKatex(content);
			}

			if (stopKinds.has(token.kind)) {
				this._stream.reset(start);
				return null;
			}

			content += this._stream.advance().raw;
		}

		this._stream.reset(start);
		return null;
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

	protected _enterRecursion(): boolean {
		this._depth++;
		return this._depth > MAX_DEPTH;
	}

	protected _leaveRecursion(): void {
		this._depth--;
	}
}
