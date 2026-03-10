import { ScanContext, flushText, emit, tryEmoticon, isLineStart } from '../ScanContext';
import { scanMentionBody } from '../helpers';
import { TokenKind } from '../Token';
import {
    CH_HASH, CH_SPACE, CH_TAB, CH_PIPE, CH_LF, CH_CR,
    CH_LBRACKET, CH_RBRACKET, CH_DOT,
} from '../constants/charCodes';
import { DIGIT_ASCII } from '../constants/charSets';
import { URL_RE, TRAIL_PUNCT } from '../constants/regexes';

/**
 * Scanner for `#`: emits a {@link TokenKind.HEADING_MARKER} at line-start,
 * falls back to a `#channel` {@link TokenKind.MENTION_CHANNEL}, an emoticon, or plain text.
 */
export function scanHash(ctx: ScanContext, pos: number): number {
    const { input } = ctx;
    const prevCode = pos > 0 ? input.charCodeAt(pos - 1) : 0;

    // heading check at line start
    if (isLineStart(pos, prevCode)) {
        let count = 0;
        while (count < 4 && input.charCodeAt(pos + count) === CH_HASH) count++;
        const afterCode = input.charCodeAt(pos + count);
        if (afterCode === CH_SPACE || afterCode === CH_TAB) {
            flushText(ctx, pos);
            emit(ctx, TokenKind.HEADING_MARKER,
                input.slice(pos, pos + count),
                String(count) as '1' | '2' | '3' | '4',
                pos);
            return pos + count;
        }
    }

    // try emoticon
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    // channel mention
    const name = scanMentionBody(input, ctx.len, pos + 1);
    if (name.length > 0) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.MENTION_CHANNEL, '#' + name, name, pos);
        return pos + 1 + name.length;
    }

    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

/**
 * Scanner for `-`: emits a {@link TokenKind.TASK_BULLET} or {@link TokenKind.UL_BULLET} at line-start,
 * falls back to an emoticon or plain text.
 */
export function scanDash(ctx: ScanContext, pos: number): number {
    const { input } = ctx;
    const prevCode = pos > 0 ? input.charCodeAt(pos - 1) : 0;

    if (isLineStart(pos, prevCode)) {
        const next = input.charCodeAt(pos + 1);

        // task bullet
        if (
            next === CH_SPACE &&
            input.charCodeAt(pos + 2) === CH_LBRACKET
        ) {
            const flag = input[pos + 3];
            if (
                (flag === 'x' || flag === ' ') &&
                input.charCodeAt(pos + 4) === CH_RBRACKET &&
                input.charCodeAt(pos + 5) === CH_SPACE
            ) {
                flushText(ctx, pos);
                const raw = `- [${flag}] `;
                emit(ctx, TokenKind.TASK_BULLET, raw, flag, pos);
                return pos + raw.length;
            }
        }

        // unordered list
        if (next === CH_SPACE || next === CH_TAB) {
            flushText(ctx, pos);
            emit(ctx, TokenKind.UL_BULLET, input.slice(pos, pos + 2), '-', pos);
            return pos + 2;
        }
    }

    // Emoticon fallback
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

/**
 * Scanner for ASCII digit characters: emits an {@link TokenKind.OL_BULLET} at line-start,
 * falls back to an emoticon, a URL, or plain text.
 */
export function scanDigit(ctx: ScanContext, pos: number): number {
    const { input, len } = ctx;
    const prevCode = pos > 0 ? input.charCodeAt(pos - 1) : 0;

    // ordered list at line start
    if (isLineStart(pos, prevCode)) {
        let numEnd = pos;
        while (numEnd < len && DIGIT_ASCII[input.charCodeAt(numEnd)]) numEnd++;
        if (input.charCodeAt(numEnd) === CH_DOT) {
            const afterDot = input.charCodeAt(numEnd + 1);
            if (afterDot === CH_SPACE || afterDot === CH_TAB) {
                flushText(ctx, pos);
                const numStr = input.slice(pos, numEnd);
                const raw = numStr + '.' + input[numEnd + 1];
                emit(ctx, TokenKind.OL_BULLET, raw, numStr, pos);
                return pos + raw.length;
            }
        }
    }

    // try emoticon
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    // try URL
    URL_RE.lastIndex = pos;
    const um = URL_RE.exec(input);
    if (um) {
        const raw = um[0].replace(TRAIL_PUNCT, '');
        if (raw.length > 0) {
            flushText(ctx, pos);
            emit(ctx, TokenKind.URL, raw, raw, pos);
            return pos + raw.length;
        }
    }

    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

/**
 * Scanner for `|` / `||`: emits a {@link TokenKind.BLOCK_SPOILER_FENCE} when `||` appears alone on a line,
 * a {@link TokenKind.SPOILER_FENCE} for inline `||`, or a {@link TokenKind.PIPE} for a single `|`.
 */
export function scanPipe(ctx: ScanContext, pos: number): number {
    const { input, len } = ctx;
    flushText(ctx, pos);

    if (input.charCodeAt(pos + 1) === CH_PIPE) {
        // || can be block or inline spoiler
        const prevCode = pos > 0 ? input.charCodeAt(pos - 1) : 0;
        const nextCode = input.charCodeAt(pos + 2);
        const isBlock =
            isLineStart(pos, prevCode) &&
            (pos + 2 >= len || nextCode === CH_LF || nextCode === CH_CR);
        emit(ctx,
            isBlock ? TokenKind.BLOCK_SPOILER_FENCE : TokenKind.SPOILER_FENCE,
            '||', '||', pos);
        return pos + 2;
    }

    emit(ctx, TokenKind.PIPE, '|', '|', pos);
    return pos + 1;
}
