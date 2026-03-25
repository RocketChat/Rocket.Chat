import type { Bold, Plain, UserMention, ChannelMention } from '../definitions';

/** Returns true if the character at the given char code is a valid identifier character (a-z, A-Z, 0-9, dot) */
function isIdentifierChar(c: number): boolean {
    return (c >= 65 && c <= 90) ||  
           (c >= 97 && c <= 122) || 
           (c >= 48 && c <= 57) ||  
           (c === 46);              
}

/** Consumes plain text until a stop character is encountered */
function parsePlainText(input: string, pos: number, stopAt: string[]): [Plain | null, number] {
    let result = '';

    while (pos < input.length) {
        if (stopAt.includes(input[pos])) break;
        result += input[pos];
        pos++;
    }

    if (result === '') return [null, pos];
    return [{ type: 'PLAIN_TEXT', value: result }, pos];
}

/** Parses a user mention in the form @username */
function parseUserMention(input: string, pos: number): [UserMention | null, number] {
    if (input[pos] !== '@') return [null, pos];
    pos++;

    let result = '';
    while (pos < input.length) {
        if (isIdentifierChar(input.charCodeAt(pos))) {
            result += input[pos];
            pos++;
        } else {
            break;
        }
    }

    if (result === '') return [null, pos];
    return [{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: result } }, pos];
}

/** Parses a channel mention in the form #channel */
function parseChannelMention(input: string, pos: number): [ChannelMention | null, number] {
    if (input[pos] !== '#') return [null, pos];
    pos++;

    let result = '';
    while (pos < input.length) {
        if (isIdentifierChar(input.charCodeAt(pos))) {
            result += input[pos];
            pos++;
        } else {
            break;
        }
    }

    if (result === '') return [null, pos];
    return [{ type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: result } }, pos];
}

/**
 * Consumes inline content items until the closing delimiter is reached.
 * Attempts to parse structured nodes (mentions) before falling back to plain text.
 */
function parseInlineContent(input: string, pos: number, closingDelimiter: string): [Bold['value'], number] {
    const items: Bold['value'] = [];

    while (pos < input.length) {
        // Stop when closing delimiter is found
        if (input.startsWith(closingDelimiter, pos)) break;

        // Try user mention: @username
        const [userMention, newPos1] = parseUserMention(input, pos);
        if (userMention !== null) {
            items.push(userMention);
            pos = newPos1;
            continue;
        }

        // Try channel mention: #channel
        const [channelMention, newPos2] = parseChannelMention(input, pos);
        if (channelMention !== null) {
            items.push(channelMention);
            pos = newPos2;
            continue;
        }

        // Consume plain text until next special character
        const [plainText, newPos3] = parsePlainText(input, pos, ['*', '@', '#']);
        if (plainText !== null) {
            items.push(plainText);
            pos = newPos3;
            continue;
        }

        // Fallback: consume one character to prevent infinite loop
        items.push({ type: 'PLAIN_TEXT', value: input[pos] });
        pos++;
    }

    return [items, pos];
}

/**
 * Parses bold markup in the form *text* or **text**.
 * Returns the Bold AST node and the position after the closing delimiter,
 * or [null, originalPos] if the input does not match.
 */
export function parseBold(input: string, pos: number): [Bold | null, number] {
    const originalPos = pos;

    if (input[pos] !== '*') return [null, pos];

    // Determine delimiter: ** takes priority over *
    const delimiter = input[pos + 1] === '*' ? '**' : '*';
    pos += delimiter.length;

    const [items, newPos] = parseInlineContent(input, pos, delimiter);
    pos = newPos;

    // Closing delimiter must be present for valid bold
    if (!input.startsWith(delimiter, pos)) return [null, originalPos];
    pos += delimiter.length;

    return [{ type: 'BOLD', value: items }, pos];
}