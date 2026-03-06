// $ and $$ for KaTeX math - tracks open/close state

import { ScanContext, flushText, emit } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_DOLLAR } from '../constants/charCodes';

export function scanDollar(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);

    if (ctx.input.charCodeAt(pos + 1) === CH_DOLLAR) {
        // $$ for block mode
        const kind = ctx.katexBlockOpen
            ? TokenKind.KATEX_BLOCK_END
            : TokenKind.KATEX_BLOCK_START;
        ctx.katexBlockOpen = !ctx.katexBlockOpen;
        emit(ctx, kind, '$$', '$$', pos);
        return pos + 2;
    }

    // $ for inline
    const kind = ctx.katexInlineOpen
        ? TokenKind.KATEX_INLINE_END
        : TokenKind.KATEX_INLINE_START;
    ctx.katexInlineOpen = !ctx.katexInlineOpen;
    emit(ctx, kind, '$', '$', pos);
    return pos + 1;
}
