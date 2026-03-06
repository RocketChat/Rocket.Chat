import { ScanContext, flushText, emit, tryEmoticon, isLineStart } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_GT, CH_T_LO, CH_COLON, CH_LBRACKET, CH_LPAREN } from '../constants/charCodes';
import { TS_INNER } from '../constants/regexes';

// < can be <t:timestamp>, emoticon, or angle bracket
export function scanAngleOpen(ctx: ScanContext, pos: number): number {
    const { input } = ctx;

    // timestamp check
    if (
        input.charCodeAt(pos + 1) === CH_T_LO &&
        input.charCodeAt(pos + 2) === CH_COLON
    ) {
        TS_INNER.lastIndex = pos + 3;
        const m = TS_INNER.exec(input);
        if (m && input.charCodeAt(pos + 3 + m[0].length) === CH_GT) {
            flushText(ctx, pos);
            const raw = input.slice(pos, pos + 3 + m[0].length + 1);
            emit(ctx, TokenKind.TIMESTAMP, raw, m[1], pos);
            return pos + raw.length;
        }
    }

    // try emoticon
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    flushText(ctx, pos);
    emit(ctx, TokenKind.ANGLE_OPEN, '<', '<', pos);
    return pos + 1;
}

// > can be emoticon, blockquote, or angle bracket
export function scanAngleClose(ctx: ScanContext, pos: number): number {
    const prevCode = pos > 0 ? ctx.input.charCodeAt(pos - 1) : 0;

    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    flushText(ctx, pos);
    const kind = isLineStart(pos, prevCode)
        ? TokenKind.BLOCKQUOTE_MARKER
        : TokenKind.ANGLE_CLOSE;
    emit(ctx, kind, '>', '>', pos);
    return pos + 1;
}

export function scanExclamation(ctx: ScanContext, pos: number): number {
    if (ctx.input.charCodeAt(pos + 1) === CH_LBRACKET) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.IMAGE_OPEN, '![', '![', pos);
        return pos + 2;
    }
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanCloseBracket(ctx: ScanContext, pos: number): number {
    if (ctx.input.charCodeAt(pos + 1) === CH_LPAREN) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.LINK_HREF_OPEN, '](', '](', pos);
        return pos + 2;
    }
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanBracketOpen(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    emit(ctx, TokenKind.LINK_OPEN, '[', '[', pos);
    return pos + 1;
}

export function scanParenClose(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    emit(ctx, TokenKind.LINK_HREF_CLOSE, ')', ')', pos);
    return pos + 1;
}
