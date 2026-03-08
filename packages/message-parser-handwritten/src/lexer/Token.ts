export enum TokenKind {
    TRIPLE_BACKTICK = 'TRIPLE_BACKTICK',
    BLOCKQUOTE_MARKER = 'BLOCKQUOTE_MARKER',
    HEADING_MARKER = 'HEADING_MARKER',
    BLOCK_SPOILER_FENCE = 'BLOCK_SPOILER_FENCE',
    KATEX_BLOCK_START = 'KATEX_BLOCK_START',
    KATEX_BLOCK_END = 'KATEX_BLOCK_END',

    ASTERISK = 'ASTERISK',
    UNDERSCORE = 'UNDERSCORE',
    TILDE = 'TILDE',
    SPOILER_FENCE = 'SPOILER_FENCE',

    BACKTICK = 'BACKTICK',

    KATEX_INLINE_START = 'KATEX_INLINE_START',
    KATEX_INLINE_END = 'KATEX_INLINE_END',

    IMAGE_OPEN = 'IMAGE_OPEN',
    LINK_OPEN = 'LINK_OPEN',
    LINK_HREF_OPEN = 'LINK_HREF_OPEN',
    LINK_HREF_CLOSE = 'LINK_HREF_CLOSE',
    ANGLE_OPEN = 'ANGLE_OPEN',
    PIPE = 'PIPE',
    ANGLE_CLOSE = 'ANGLE_CLOSE',

    MENTION_USER = 'MENTION_USER',
    MENTION_CHANNEL = 'MENTION_CHANNEL',

    EMOJI_SHORTCODE = 'EMOJI_SHORTCODE',
    EMOJI_UNICODE = 'EMOJI_UNICODE',
    EMOTICON = 'EMOTICON',

    TIMESTAMP = 'TIMESTAMP',

    UL_BULLET = 'UL_BULLET',
    OL_BULLET = 'OL_BULLET',
    TASK_BULLET = 'TASK_BULLET',

    COLOR = 'COLOR',

    URL = 'URL',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',

    WHITESPACE = 'WHITESPACE',
    NEWLINE = 'NEWLINE',

    ESCAPED = 'ESCAPED',

    TEXT = 'TEXT',
    CODE_CONTENT = 'CODE_CONTENT',
    EOF = 'EOF',
}

export interface Token {
    kind: TokenKind;
    raw: string;
    value: string;
    start: number;
    end: number;
}

export function makeToken(
    kind: TokenKind,
    raw: string,
    value: string,
    start: number,
): Token {
    return { kind, raw, value, start, end: start + raw.length };
}
