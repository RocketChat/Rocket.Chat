import { Lexer } from '../src/lexer/lexer';
import { TokenKind } from '../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);

// ── headings ────────────────────────────────────────────────────────────────

describe('headings', () => {
    test('# through #### all produce HEADING_MARKER with the level as value', () => {
        expect(kv('# Title')[0]).toEqual(['HEADING_MARKER', '1']);
        expect(kv('## Title')[0]).toEqual(['HEADING_MARKER', '2']);
        expect(kv('### Title')[0]).toEqual(['HEADING_MARKER', '3']);
        expect(kv('#### Title')[0]).toEqual(['HEADING_MARKER', '4']);
    });

    test('five or more hashes is just text, not a heading', () => {
        expect(kinds('##### Title')).toEqual(['TEXT', 'WHITESPACE', 'TEXT']);
    });

    test('needs a space or tab after the hashes', () => {
        // no space → treated as channel mention
        expect(kv('#channel')).toEqual([['MENTION_CHANNEL', 'channel']]);
        // tab works too
        expect(kinds('#\tTitle')).toEqual(['HEADING_MARKER', 'WHITESPACE', 'TEXT']);
    });

    test('only works at the start of a line', () => {
        expect(kinds('text #channel')).toEqual(['TEXT', 'WHITESPACE', 'MENTION_CHANNEL']);
        expect(kinds('a # b')).toEqual(['TEXT', 'WHITESPACE', 'TEXT', 'WHITESPACE', 'TEXT']);
    });

    test('newline resets the "line start" context', () => {
        expect(kinds('line1\n# Title')).toEqual([
            'TEXT', 'NEWLINE', 'HEADING_MARKER', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('bare # with nothing valid after it', () => {
        expect(kinds('#')).toEqual(['TEXT']);
        expect(kinds('#!')).toEqual(['TEXT']);
    });

    test('# can match emoticons like #) and #-)', () => {
        expect(kv('#)')).toEqual([['EMOTICON', 'dizzy_face']]);
        expect(kv('#-)')).toEqual([['EMOTICON', 'dizzy_face']]);
    });
});

// ── list bullets (dash) ─────────────────────────────────────────────────────

describe('unordered list bullets (-)', () => {
    test('dash + space at line start', () => {
        expect(kinds('- item')).toEqual(['UL_BULLET', 'TEXT']);
        expect(kinds('-\titem')).toEqual(['UL_BULLET', 'TEXT']);
    });

    test('dash mid-line is just text', () => {
        expect(kinds('a - b')).toEqual(['TEXT', 'WHITESPACE', 'TEXT', 'WHITESPACE', 'TEXT']);
    });

    test('after a newline', () => {
        expect(kinds('line\n- item')).toEqual(['TEXT', 'NEWLINE', 'UL_BULLET', 'TEXT']);
    });

    test('dash with no space after is not a bullet', () => {
        expect(kinds('-x')).toEqual(['TEXT']);
    });

    test('dash can match emoticons like -_-', () => {
        expect(kv('-_-')).toEqual([['EMOTICON', 'expressionless']]);
        expect(kv('-__-')).toEqual([['EMOTICON', 'expressionless']]);
        expect(kv('-___-')).toEqual([['EMOTICON', 'expressionless']]);
    });
});

// ── task bullets ────────────────────────────────────────────────────────────

describe('task bullets', () => {
    test('checked and unchecked', () => {
        expect(kv('- [x] done')).toEqual([['TASK_BULLET', 'x'], ['TEXT', 'done']]);
        expect(kv('- [ ] todo')).toEqual([['TASK_BULLET', ' '], ['TEXT', 'todo']]);
    });

    test('invalid flag falls back to a regular bullet', () => {
        // only 'x' and ' ' are valid flags
        expect(kinds('- [y] text')).toEqual([
            'UL_BULLET', 'LINK_OPEN', 'TEXT', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('not recognized mid-line', () => {
        expect(kinds('a - [x] done')).toEqual([
            'TEXT', 'WHITESPACE', 'TEXT', 'WHITESPACE', 'LINK_OPEN', 'TEXT', 'WHITESPACE', 'TEXT',
        ]);
    });
});

// ── ordered lists ───────────────────────────────────────────────────────────

describe('ordered list bullets', () => {
    test('single and multi-digit numbers', () => {
        expect(kv('1. item')).toEqual([['OL_BULLET', '1'], ['TEXT', 'item']]);
        expect(kv('42. item')).toEqual([['OL_BULLET', '42'], ['TEXT', 'item']]);
        expect(kv('999. item')).toEqual([['OL_BULLET', '999'], ['TEXT', 'item']]);
    });

    test('tab after the dot works too', () => {
        expect(kv('1.\titem')).toEqual([['OL_BULLET', '1'], ['TEXT', 'item']]);
    });

    test('not at line start → just text', () => {
        expect(kinds('a 1. text')).toEqual(['TEXT', 'WHITESPACE', 'TEXT', 'WHITESPACE', 'TEXT']);
    });

    test('number.text with no space becomes a URL', () => {
        expect(kinds('1.text')).toEqual(['URL']);
        expect(kv('1.com')).toEqual([['URL', '1.com']]);
    });

    test('number. alone (no space) is just text', () => {
        expect(kinds('1.')).toEqual(['TEXT']);
    });

    test('after a newline', () => {
        expect(kinds('line\n1. item')).toEqual(['TEXT', 'NEWLINE', 'OL_BULLET', 'TEXT']);
    });

    test('digits can match emoticons too (8-))', () => {
        expect(kv('8-)')).toEqual([['EMOTICON', 'sunglasses']]);
        expect(kv('8-D')).toEqual([['EMOTICON', 'sunglasses']]);
    });
});

// ── pipes & spoilers ────────────────────────────────────────────────────────

describe('pipes and spoiler fences', () => {
    test('single pipe', () => {
        expect(kinds('a|b')).toEqual(['TEXT', 'PIPE', 'TEXT']);
        expect(kinds('a|b|c')).toEqual(['TEXT', 'PIPE', 'TEXT', 'PIPE', 'TEXT']);
    });

    test('|| inline = spoiler fence', () => {
        expect(kinds('||spoiler||')).toEqual(['SPOILER_FENCE', 'TEXT', 'SPOILER_FENCE']);
        expect(kinds('||text||')).toEqual(['SPOILER_FENCE', 'TEXT', 'SPOILER_FENCE']);
    });

    test('|| alone on a line = block spoiler fence', () => {
        expect(kinds('||\n||')).toEqual(['BLOCK_SPOILER_FENCE', 'NEWLINE', 'BLOCK_SPOILER_FENCE']);
        expect(kinds('||')).toEqual(['BLOCK_SPOILER_FENCE']);
        expect(kinds('||\r')).toEqual(['BLOCK_SPOILER_FENCE', 'NEWLINE']);
    });

    test('|| after newline is also a block spoiler', () => {
        expect(kinds('text\n||')).toEqual(['TEXT', 'NEWLINE', 'BLOCK_SPOILER_FENCE']);
    });

    test('lone pipe', () => {
        expect(kinds('|')).toEqual(['PIPE']);
    });

    test('pipe after newline', () => {
        expect(kinds('line\n|text')).toEqual(['TEXT', 'NEWLINE', 'PIPE', 'TEXT']);
    });
});
