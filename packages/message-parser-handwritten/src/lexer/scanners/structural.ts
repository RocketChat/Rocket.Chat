import { ScanContext, flushText, emit } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_LBRACKET, CH_RBRACKET, CH_LPAREN, CH_RPAREN } from '../constants/charCodes';
import { ESCAPABLE, WS_ASCII } from '../constants/charSets';

export function scanNewline(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    const raw = ctx.input[pos] === '\r' && ctx.input[pos + 1] === '\n'
        ? '\r\n'
        : ctx.input[pos];
    emit(ctx, TokenKind.NEWLINE, raw, raw, pos);
    return pos + raw.length;
}

// backslash: KaTeX delimiters or escaped chars
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

    // not a recognized escape
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanWhitespace(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    let end = pos + 1;
    while (end < ctx.len && WS_ASCII[ctx.input.charCodeAt(end)]) end++;
    const raw = ctx.input.slice(pos, end);
    emit(ctx, TokenKind.WHITESPACE, raw, raw, pos);
    return end;
}
