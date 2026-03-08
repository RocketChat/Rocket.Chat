import { ScanContext, flushText, emit } from '../ScanContext';
import { TokenKind } from '../Token';
import { CH_BACKTICK, CH_LF, CH_CR } from '../constants/charCodes';

export function scanBacktick(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    if (
        ctx.input.charCodeAt(pos + 1) === CH_BACKTICK &&
        ctx.input.charCodeAt(pos + 2) === CH_BACKTICK
    ) {
        return scanFencedBlock(ctx, pos);
    }
    return scanInlineCode(ctx, pos);
}

// ``` fenced code block
function scanFencedBlock(ctx: ScanContext, pos: number): number {
    const { input, len } = ctx;
    emit(ctx, TokenKind.TRIPLE_BACKTICK, '```', '```', pos);
    pos += 3;

    const bodyStart = pos;
    while (pos < len) {
        if (
            input.charCodeAt(pos) === CH_BACKTICK &&
            input.charCodeAt(pos + 1) === CH_BACKTICK &&
            input.charCodeAt(pos + 2) === CH_BACKTICK
        ) {
            emitCodeBody(ctx, bodyStart, pos);
            emit(ctx, TokenKind.TRIPLE_BACKTICK, '```', '```', pos);
            return pos + 3;
        }
        pos++;
    }

    // unclosed fence
    emitCodeBody(ctx, bodyStart, pos);
    return pos;
}

// single ` inline code (doesn't cross lines)
function scanInlineCode(ctx: ScanContext, pos: number): number {
    const { input, len } = ctx;
    emit(ctx, TokenKind.BACKTICK, '`', '`', pos);
    pos += 1;

    const bodyStart = pos;
    while (pos < len) {
        const c = input.charCodeAt(pos);
        if (c === CH_BACKTICK) {
            emitCodeBody(ctx, bodyStart, pos);
            emit(ctx, TokenKind.BACKTICK, '`', '`', pos);
            return pos + 1;
        }
        if (c === CH_LF || c === CH_CR) {
            // unclosed
            emitTextBody(ctx, bodyStart, pos);
            return pos;
        }
        pos++;
    }

    // EOF
    emitTextBody(ctx, bodyStart, pos);
    return pos;
}

function emitCodeBody(ctx: ScanContext, start: number, end: number): void {
    if (end > start) {
        const body = ctx.input.slice(start, end);
        emit(ctx, TokenKind.CODE_CONTENT, body, body, start);
    }
}

function emitTextBody(ctx: ScanContext, start: number, end: number): void {
    if (end > start) {
        const body = ctx.input.slice(start, end);
        emit(ctx, TokenKind.TEXT, body, body, start);
    }
}
