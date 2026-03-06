import { ScanContext, flushText, emit, tryEmoticon } from '../ScanContext';
import { scanMentionBody, scanEmojiShortCode } from '../helpers';
import { TokenKind } from '../Token';
import { CH_SLASH } from '../constants/charCodes';
import { URL_RE, EMAIL_RE, PHONE_RE, COLOR_RE, TRAIL_PUNCT } from '../constants/regexes';

// : can be URL scheme (://), :emoji:, or emoticon
export function scanColon(ctx: ScanContext, pos: number): number {
    // URL scheme check
    if (
        ctx.input.charCodeAt(pos + 1) === CH_SLASH &&
        ctx.input.charCodeAt(pos + 2) === CH_SLASH
    ) {
        return tryUrlScheme(ctx, pos);
    }

    // emoji shortcode
    const end = scanEmojiShortCode(ctx.input, ctx.len, pos);
    if (end !== -1) {
        flushText(ctx, pos);
        const raw = ctx.input.slice(pos, end);
        emit(ctx, TokenKind.EMOJI_SHORTCODE, raw, raw.slice(1, -1), pos);
        return end;
    }

    // emoticon
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;

    // plain text
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

// handle :// by popping previous TEXT token and rescanning as URL
function tryUrlScheme(ctx: ScanContext, pos: number): number {
    flushText(ctx, pos);
    const lastIdx = ctx.tokens.length - 1;
    const prevTok = lastIdx >= 0 ? ctx.tokens[lastIdx] : null;

    const urlStart = prevTok?.kind === TokenKind.TEXT ? prevTok.start : pos;
    URL_RE.lastIndex = urlStart;
    const m = URL_RE.exec(ctx.input);
    if (m) {
        const raw = m[0].replace(TRAIL_PUNCT, '');
        if (raw.length > 0) {
            if (prevTok?.kind === TokenKind.TEXT) ctx.tokens.pop();
            emit(ctx, TokenKind.URL, raw, raw, urlStart);
            return urlStart + raw.length;
        }
    }

    // no valid URL
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanAt(ctx: ScanContext, pos: number): number {
    const name = scanMentionBody(ctx.input, ctx.len, pos + 1);
    if (name.length > 0) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.MENTION_USER, ctx.input.slice(pos, pos + 1 + name.length), name, pos);
        return pos + 1 + name.length;
    }
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanPlus(ctx: ScanContext, pos: number): number {
    const { input } = ctx;

    PHONE_RE.lastIndex = pos;
    const pm = PHONE_RE.exec(input);
    if (pm) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.PHONE, pm[0], pm[0], pos);
        return pos + pm[0].length;
    }

    EMAIL_RE.lastIndex = pos;
    const em = EMAIL_RE.exec(input);
    if (em) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.EMAIL, em[0], em[0], pos);
        return pos + em[0].length;
    }

    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

// c can start color:#hex, URL, or email
export function scanC(ctx: ScanContext, pos: number): number {
    const { input } = ctx;

    // color token
    if (input.startsWith('color:#', pos)) {
        COLOR_RE.lastIndex = pos;
        const m = COLOR_RE.exec(input);
        if (m) {
            emit(ctx, TokenKind.COLOR, m[0], m[1], pos);
            return pos + m[0].length;
        }
    }

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

    // try email
    EMAIL_RE.lastIndex = pos;
    const em = EMAIL_RE.exec(input);
    if (em) {
        flushText(ctx, pos);
        emit(ctx, TokenKind.EMAIL, em[0], em[0], pos);
        return pos + em[0].length;
    }

    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}

export function scanEmoticonStarter(ctx: ScanContext, pos: number): number {
    const emResult = tryEmoticon(ctx, pos);
    if (emResult !== false) return emResult;
    if (ctx.textStart === -1) ctx.textStart = pos;
    return pos + 1;
}
