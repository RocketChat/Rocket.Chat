import { makeToken, Token, TokenKind } from './Token';
import { ScanContext, flushText } from './ScanContext';
import { CHAR_CLASS, isUnicodeEmojiStart } from './constants/charSets';
import { SCANNER_TABLE } from './scanners/index';
import { scanUnicodeEmoji } from './scanners/emoji';

// Safety cap to avoid runaway tokenization on malformed input.
const MAX_TOKENS = 4096;

export class Lexer {
    private readonly _input: string;
    private readonly _len: number;

    constructor(input: string) {
        this._input = input;
        this._len = input.length;
    }

    tokenize(): Token[] {
        const ctx: ScanContext = {
            input: this._input,
            len: this._len,
            tokens: [],
            textStart: -1,
            katexBlockOpen: false,
            katexInlineOpen: false,
        };

        let pos = 0;
        let truncated = false;
        while (pos < ctx.len) {
            if (ctx.tokens.length >= MAX_TOKENS) {
                truncated = true;
                break;
            }
            const code = ctx.input.charCodeAt(pos);

            // Plain ASCII text path
            if (code < 128 && CHAR_CLASS[code] === 0) {
                if (ctx.textStart === -1) ctx.textStart = pos;
                pos++;
                continue;
            }

            // Non-ASCII path
            if (code >= 128) {
                if (isUnicodeEmojiStart(ctx.input, pos)) {
                    flushText(ctx, pos);
                    pos = scanUnicodeEmoji(ctx, pos);
                } else {
                    if (ctx.textStart === -1) ctx.textStart = pos;
                    pos++;
                }
                continue;
            }

            // Special char dispatch
            const scanner = SCANNER_TABLE[code];
            if (scanner) {
                pos = scanner(ctx, pos);
            } else {
                // fallback to plain text
                if (ctx.textStart === -1) ctx.textStart = pos;
                pos++;
            }
        }

        flushText(ctx, truncated ? ctx.len : pos);
        if (!truncated) {
            ctx.tokens.push(makeToken(TokenKind.EOF, '', '', pos));
        }
        return ctx.tokens;
    }
}
