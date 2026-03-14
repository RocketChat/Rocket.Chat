import { SHORTCODE_OK, MENTION_OK } from './constants/charSets';
import { CH_COLON, CH_AT } from './constants/charCodes';

/**
 * Scans an `@mention` or `#channel` name starting at `nameStart`.
 * Returns the matched name string (without the leading sigil), or an empty string if no valid name is found.
 */
export function scanMentionBody(input: string, len: number, nameStart: number): string {
    let i = nameStart;

    if (i >= len) return '';
    const firstCode = input.charCodeAt(i);
    if (firstCode >= 128 || !MENTION_OK[firstCode]) return '';

    while (i < len) {
        const c = input.charCodeAt(i);
        if (c >= 128 || !MENTION_OK[c]) break;
        i++;
    }

    // handle optional sub-address segments (: or @)
    while (i < len) {
        const separator = input.charCodeAt(i);
        if (separator !== CH_COLON && separator !== CH_AT) break;

        const separatorPos = i;
        i++;

        if (i >= len || input.charCodeAt(i) >= 128 || !MENTION_OK[input.charCodeAt(i)]) {
            i = separatorPos;
            break;
        }

        i++;
        while (i < len) {
            const c = input.charCodeAt(i);
            if (c >= 128 || !MENTION_OK[c]) break;
            i++;
        }
    }

    return input.slice(nameStart, i);
}

/**
 * Scans an emoji shortcode in the form `:name:` starting at `start`.
 * Returns the position just after the closing `:`, or `-1` if no valid shortcode is found.
 */
export function scanEmojiShortCode(input: string, len: number, start: number): number {
    let i = start + 1;

    if (i >= len) return -1;
    const firstCode = input.charCodeAt(i);
    if (firstCode >= 128 || !SHORTCODE_OK[firstCode]) return -1;
    i++;

    while (i < len) {
        const c = input.charCodeAt(i);
        if (c >= 128 || !SHORTCODE_OK[c]) {
            return c === CH_COLON ? i + 1 : -1;
        }
        i++;
    }

    return -1;
}
