import { ScanContext, flushText, emit, consumeRun, tryEmoticon, isLineStart } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_ASTERISK, CH_UNDERSCORE, CH_TILDE, CH_SPACE, CH_TAB } from '../constants/charCodes';

// * can be list bullet, emoticon, or emphasis
export function scanAsterisk(ctx: ScanContext, pos: number): number {
    const { input } = ctx;
    const prevCode = pos > 0 ? input.charCodeAt(pos - 1) : 0;

    // list bullet check
    if (isLineStart(pos, prevCode)) {
        const next = input.charCodeAt(pos + 1);
        if (next === CH_SPACE || next === CH_TAB) {
            flushText(ctx, pos);
            emit(ctx, TokenKind.UL_BULLET, input.slice(pos, pos + 2), '*', pos);
            return pos + 2;
        }
    }

    // try emoticon
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    // emphasis marker
    flushText(ctx, pos);
    const len = consumeRun(input, pos, CH_ASTERISK);
    const raw = input.slice(pos, pos + len);
    emit(ctx, TokenKind.ASTERISK, raw, raw, pos);
    return pos + len;
}

export function scanUnderscore(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    const len = consumeRun(ctx.input, pos, CH_UNDERSCORE);
    const raw = ctx.input.slice(pos, pos + len);
    emit(ctx, TokenKind.UNDERSCORE, raw, raw, pos);
    return pos + len;
}

export function scanTilde(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    const len = consumeRun(ctx.input, pos, CH_TILDE);
    const raw = ctx.input.slice(pos, pos + len);
    emit(ctx, TokenKind.TILDE, raw, raw, pos);
    return pos + len;
}
