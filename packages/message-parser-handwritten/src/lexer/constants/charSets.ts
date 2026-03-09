import {
    CH_0, CH_9,
    CH_A_UP, CH_Z_UP,
    CH_A_LO, CH_Z_LO,
    CH_C_LO,
    CH_SPACE, CH_TAB,
    CH_DASH, CH_UNDERSCORE, CH_DOT, CH_PLUS,
} from './charCodes';

// special chars that need handling during tokenization
export const CHAR_CLASS = new Uint8Array(128);

for (const ch of '\r\n\\`$<>|#-*_~:@![])+\t ') CHAR_CLASS[ch.charCodeAt(0)] = 1;
for (let d = CH_0; d <= CH_9; d++) CHAR_CLASS[d] = 1;
CHAR_CLASS[CH_C_LO] = 1;
for (const ch of "'=;XDB8%(yO") CHAR_CLASS[ch.charCodeAt(0)] = 1;

// chars that can be backslash-escaped
export const ESCAPABLE = new Uint8Array(128);
for (const ch of '*_~`#.') ESCAPABLE[ch.charCodeAt(0)] = 1;

// valid chars for @mention and #channel names (alphanumeric + - _ .)
export const MENTION_OK = new Uint8Array(128);
for (let c = CH_0;    c <= CH_9;    c++) MENTION_OK[c] = 1; // 0–9
for (let c = CH_A_UP; c <= CH_Z_UP; c++) MENTION_OK[c] = 1; // A–Z
for (let c = CH_A_LO; c <= CH_Z_LO; c++) MENTION_OK[c] = 1; // a–z
MENTION_OK[CH_DASH]       = 1; // -
MENTION_OK[CH_UNDERSCORE] = 1; // _
MENTION_OK[CH_DOT]        = 1; // .

// valid chars for :emoji_shortcode: (alphanumeric + - _ + .)
export const SHORTCODE_OK = new Uint8Array(128);
for (let c = CH_0;    c <= CH_9;    c++) SHORTCODE_OK[c] = 1; // 0–9
for (let c = CH_A_UP; c <= CH_Z_UP; c++) SHORTCODE_OK[c] = 1; // A–Z
for (let c = CH_A_LO; c <= CH_Z_LO; c++) SHORTCODE_OK[c] = 1; // a–z
SHORTCODE_OK[CH_DASH]       = 1; // -
SHORTCODE_OK[CH_UNDERSCORE] = 1; // _
SHORTCODE_OK[CH_PLUS]       = 1; // +
SHORTCODE_OK[CH_DOT]        = 1; // .

// digit lookup 0-9
export const DIGIT_ASCII = new Uint8Array(128);
for (let d = CH_0; d <= CH_9; d++) DIGIT_ASCII[d] = 1;

// horizontal whitespace (space and tab)
export const WS_ASCII = new Uint8Array(128);
WS_ASCII[CH_SPACE] = 1;
WS_ASCII[CH_TAB]   = 1;

// check if position starts a unicode emoji
export function isUnicodeEmojiStart(input: string, pos: number): boolean {
    const c1 = input.charCodeAt(pos);
    if (c1 >= 0x2300 && c1 <= 0x27bf) return true; // BMP emoji (symbols, dingbats)
    const c2 = (c1 >= 0xd800 && c1 <= 0xdbff)
        ? (pos + 1 < input.length ? input.charCodeAt(pos + 1) : -1)
        : -1;
    if (c2 === -1) return false;
    if (c1 === 0xd83c && c2 >= 0xdf00 && c2 <= 0xdfff) return true; // U+1F300
    if (c1 === 0xd83c && c2 >= 0xdd00 && c2 <= 0xddff) return true; // U+1F100
    if (c1 === 0xd83d && c2 >= 0xdc00 && c2 <= 0xddff) return true; // U+1F400
    if (c1 === 0xd83d && c2 >= 0xde00 && c2 <= 0xde4f) return true; // U+1F600
    if (c1 === 0xd83d && c2 >= 0xde80 && c2 <= 0xdefa) return true; // U+1F680
    if (c1 === 0xd83e && c2 >= 0xdd00 && c2 <= 0xddff) return true; // U+1F900
    if (c1 === 0xd83e && c2 >= 0xde00 && c2 <= 0xdeff) return true; // U+1FA00
    return false;
}
