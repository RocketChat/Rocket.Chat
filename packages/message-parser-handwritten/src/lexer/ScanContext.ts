import { makeToken, Token, TokenKind } from './Token';
import { EMOTICON_TRIE, getEmoticonShortCode } from './constants/emoticons';
import { CH_LF, CH_CR } from './constants/charCodes';

export interface ScanContext {
    readonly input: string;
    readonly len: number;
    readonly tokens: Token[];
    textStart: number;         // start of current plain-text run; -1 = none
    katexBlockOpen: boolean;   // toggle for $$ open/close
    katexInlineOpen: boolean;  // toggle for $ open/close
}

export type ScanFn = (ctx: ScanContext, pos: number) => number;

export function isLineStart(pos: number, prevCode: number): boolean {
    return pos === 0 || prevCode === CH_LF || prevCode === CH_CR;
}

// Flush accumulated text as a TEXT token
export function flushText(ctx: ScanContext, pos: number): void {
    if (ctx.textStart === -1) return;
    const raw = ctx.input.slice(ctx.textStart, pos);
    ctx.tokens.push(makeToken(TokenKind.TEXT, raw, raw, ctx.textStart));
    ctx.textStart = -1;
}

export function emit(
    ctx: ScanContext,
    kind: TokenKind,
    raw: string,
    value: string,
    start: number,
): void {
    ctx.tokens.push(makeToken(kind, raw, value, start));
}

export function consumeRun(input: string, pos: number, charCode: number): number {
    let count = 0;
    while (input.charCodeAt(pos + count) === charCode) count++;
    return count;
}

// Try to match emoticon at pos using trie. Returns new position or false.
export function tryEmoticon(ctx: ScanContext, pos: number): number | false {
    const { input, len } = ctx;
    let node = EMOTICON_TRIE;
    let lastMatch: string | null = null;
    let lastMatchEnd = pos;
    let i = pos;

    while (i < len) {
        const child = node.ch[input.charCodeAt(i)];
        if (!child) break;
        node = child;
        i++;
        if (node.value !== null) {
            lastMatch = node.value;
            lastMatchEnd = i;
        }
    }

    if (lastMatch === null) return false;

    flushText(ctx, pos);
    const raw = input.slice(pos, lastMatchEnd);
    emit(ctx, TokenKind.EMOTICON, raw, getEmoticonShortCode(raw) ?? raw, pos);
    return lastMatchEnd;
}
