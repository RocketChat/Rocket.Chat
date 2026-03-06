import { ScanContext, emit } from '../ScanContext';
import { TokenKind } from '../Token';
import { isUnicodeEmojiStart } from '../constants/charSets';

export function scanUnicodeEmoji(ctx: ScanContext, pos: number): number {
    const { input, len } = ctx;
    let i = pos;

    // base codepoint
    const c1 = input.charCodeAt(i);
    i += (c1 >= 0xd800 && c1 <= 0xdfff) ? 2 : 1;

    // variation selector
    if (i < len) {
        const vs = input.charCodeAt(i);
        if (vs === 0xfe0e || vs === 0xfe0f) i++;
    }

    // skin tone modifier
    if (i + 1 < len && input.charCodeAt(i) === 0xd83c) {
        const lo = input.charCodeAt(i + 1);
        if (lo >= 0xdffb && lo <= 0xdfff) i += 2;
    }

    // ZWJ sequences
    while (i < len && input.charCodeAt(i) === 0x200d) {
        i++;
        if (i >= len) break;
        const next = input.charCodeAt(i);
        if (next >= 0xd800 && next <= 0xdfff) { i += 2; }
        else if (isUnicodeEmojiStart(input, i)) { i++; }
        else { i--; break; }
        if (i < len) {
            const vs2 = input.charCodeAt(i);
            if (vs2 === 0xfe0e || vs2 === 0xfe0f) i++;
        }
    }

    const raw = input.slice(pos, i);
    emit(ctx, TokenKind.EMOJI_UNICODE, raw, raw, pos);
    return i;
}
