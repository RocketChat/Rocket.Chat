import { makeToken, Token, TokenKind } from './Token';
import { EMOTICON_TRIE, getEmoticonShortCode } from './constants/emoticons';
import { CH_LF, CH_CR } from './constants/charCodes';

// Safety cap to avoid runaway tokenization on malformed input.
export const MAX_TOKENS = 4096;

export interface ScanContext {
    readonly input: string;
    readonly len: number;
    readonly tokens: Token[];
    textStart: number;         // start of current plain-text run; -1 = none
    katexBlockOpen: boolean;   // toggle for $$ open/close
    katexInlineOpen: boolean;  // toggle for $ open/close
}

export type ScanFn = (ctx: ScanContext, pos: number) => number;

/** Returns `true` when `pos` is at column 0 (start of input or after a newline character). */
export function isLineStart(pos: number, prevCode: number): boolean {
    return pos === 0 || prevCode === CH_LF || prevCode === CH_CR;
}

/** Flushes any accumulated plain-text run as a {@link TokenKind.TEXT} token and resets `textStart`. */
export function flushText(ctx: ScanContext, pos: number): void {
    if (ctx.textStart === -1) return;
    if (ctx.tokens.length >= MAX_TOKENS) { ctx.textStart = -1; return; }
    const raw = ctx.input.slice(ctx.textStart, pos);
    ctx.tokens.push(makeToken(TokenKind.TEXT, raw, raw, ctx.textStart));
    ctx.textStart = -1;
}

/** Appends a new token to the context's token list (no-op if the safety cap is reached). */
export function emit(
    ctx: ScanContext,
    kind: TokenKind,
    raw: string,
    value: string,
    start: number,
): void {
    if (ctx.tokens.length >= MAX_TOKENS) return;
    ctx.tokens.push(makeToken(kind, raw, value, start));
}

/** Counts how many consecutive occurrences of `charCode` appear starting at `pos` and returns that count. */
export function consumeRun(input: string, pos: number, charCode: number): number {
    let count = 0;
    while (input.charCodeAt(pos + count) === charCode) count++;
    return count;
}

/**
 * Tries to match a text emoticon at `pos` using the emoticon trie.
 * On success, flushes pending text, emits an {@link TokenKind.EMOTICON} token, and returns the new position.
 * Returns `false` when no emoticon is found.
 */
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
