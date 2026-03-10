import { ScanContext, flushText, emit, tryEmoticon } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_LBRACKET, CH_RBRACKET, CH_LPAREN, CH_RPAREN } from '../constants/charCodes';
import { ESCAPABLE, WS_ASCII } from '../constants/charSets';

/** Scanner for `\r` / `\n`: flushes pending text and emits a {@link TokenKind.NEWLINE} token (handles CRLF pairs). */
export function scanNewline(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    const raw = ctx.input[pos] === '\r' && ctx.input[pos + 1] === '\n'
        ? '\r\n'
        : ctx.input[pos];
    emit(ctx, TokenKind.NEWLINE, raw, raw, pos);
    return pos + raw.length;
}

/**
 * Scanner for `\`: handles KaTeX delimiters (`\[`, `\]`, `\(`, `\)`),
 * escapable ASCII characters, and falls back to emoticonsOR plain text.
 */
export function scanEscape(ctx: ScanContext, pos: number): number {
    const next = ctx.input.charCodeAt(pos + 1);

    // KaTeX delimiters
    if (next === CH_LBRACKET) { flushText(ctx, pos); emit(ctx, TokenKind.KATEX_BLOCK_START, '\\[', '\\[', pos); ctx.katexBlockOpen = true; return pos + 2; }
    if (next === CH_RBRACKET) { flushText(ctx, pos); emit(ctx, TokenKind.KATEX_BLOCK_END, '\\]', '\\]', pos); ctx.katexBlockOpen = false; return pos + 2; }
    if (next === CH_LPAREN) { flushText(ctx, pos); emit(ctx, TokenKind.KATEX_INLINE_START, '\\(', '\\(', pos); ctx.katexInlineOpen = true; return pos + 2; }
    if (next === CH_RPAREN) { flushText(ctx, pos); emit(ctx, TokenKind.KATEX_INLINE_END, '\\)', '\\)', pos); ctx.katexInlineOpen = false; return pos + 2; }

    // escapable char
    if (next < 128 && ESCAPABLE[next]) {
        flushText(ctx, pos);
        const escaped = ctx.input[pos + 1];
        emit(ctx, TokenKind.ESCAPED, `\\${escaped}`, escaped, pos);
        return pos + 2;
    }

    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    // not a recognized escape
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

/** Scanner for ASCII whitespace (space, tab): emits a {@link TokenKind.WHITESPACE} token spanning the full run. */
export function scanWhitespace(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    let end = pos + 1;
    while (end < ctx.len && WS_ASCII[ctx.input.charCodeAt(end)]) end++;
    const raw = ctx.input.slice(pos, end);
    emit(ctx, TokenKind.WHITESPACE, raw, raw, pos);
    return end;
}
