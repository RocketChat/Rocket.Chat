import { Lexer } from '../../src/lexer/lexer';
import { TokenKind } from '../../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);

// ── markdown links ──────────────────────────────────────────────────────────

describe('markdown links', () => {
    test('standard [text](url)', () => {
        expect(kinds('[text](url)')).toEqual([
            'LINK_OPEN', 'TEXT', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE',
        ]);
    });

    test('empty parts', () => {
        expect(kinds('[](url)')).toEqual(['LINK_OPEN', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE']);
        expect(kinds('[text]()')).toEqual(['LINK_OPEN', 'TEXT', 'LINK_HREF_OPEN', 'LINK_HREF_CLOSE']);
        expect(kinds('[]()')).toEqual(['LINK_OPEN', 'LINK_HREF_OPEN', 'LINK_HREF_CLOSE']);
    });

    test('spaces in the title', () => {
        expect(kinds('[hello world](url)')).toEqual([
            'LINK_OPEN', 'TEXT', 'WHITESPACE', 'TEXT', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE',
        ]);
    });

    test('nested brackets', () => {
        expect(kinds('[[inner]](url)')).toEqual([
            'LINK_OPEN', 'LINK_OPEN', 'TEXT', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE',
        ]);
    });

    test('lone bracket and paren', () => {
        expect(kinds('[')).toEqual(['LINK_OPEN']);
        expect(kinds(')')).toEqual(['LINK_HREF_CLOSE']);
    });
});

// ── close bracket ───────────────────────────────────────────────────────────

describe('close bracket ]', () => {
    test('] not followed by ( is plain text, not LINK_HREF_OPEN', () => {
        expect(kinds('] text')).toEqual(['TEXT', 'WHITESPACE', 'TEXT']);
        expect(kinds(']x')).toEqual(['TEXT']);
        expect(kinds(']')).toEqual(['TEXT']);
    });
});

// ── images ──────────────────────────────────────────────────────────────────

describe('images', () => {
    test('![alt](src) opens an image', () => {
        expect(kinds('![alt](src)')).toEqual([
            'IMAGE_OPEN', 'TEXT', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE',
        ]);
    });

    test('empty alt', () => {
        expect(kinds('![](src)')).toEqual(['IMAGE_OPEN', 'LINK_HREF_OPEN', 'TEXT', 'LINK_HREF_CLOSE']);
    });

    test('! without [ is just text', () => {
        expect(kinds('!text')).toEqual(['TEXT']);
        expect(kinds('!')).toEqual(['TEXT']);
        expect(kinds('! text')).toEqual(['TEXT', 'WHITESPACE', 'TEXT']);
    });
});

// ── angle brackets ──────────────────────────────────────────────────────────

describe('angle brackets', () => {
    test('< opens, > closes', () => {
        expect(kinds('<url>')).toEqual(['ANGLE_OPEN', 'TEXT', 'ANGLE_CLOSE']);
        expect(kinds('<url|title>')).toEqual(['ANGLE_OPEN', 'TEXT', 'PIPE', 'TEXT', 'ANGLE_CLOSE']);
    });

    test('> at line start becomes a blockquote marker', () => {
        expect(kinds('> quote')).toEqual(['BLOCKQUOTE_MARKER', 'WHITESPACE', 'TEXT']);
        expect(kinds('line\n> quote')).toEqual([
            'TEXT', 'NEWLINE', 'BLOCKQUOTE_MARKER', 'WHITESPACE', 'TEXT',
        ]);
        expect(kinds('line\r> quote')).toEqual([
            'TEXT', 'NEWLINE', 'BLOCKQUOTE_MARKER', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('> mid-line is just ANGLE_CLOSE', () => {
        expect(kinds('a > b')).toEqual(['TEXT', 'WHITESPACE', 'ANGLE_CLOSE', 'WHITESPACE', 'TEXT']);
    });

    test('< just by itself', () => {
        expect(kinds('<tag')).toEqual(['ANGLE_OPEN', 'TEXT']);
    });
});

// ── angle emoticons ─────────────────────────────────────────────────────────

describe('emoticons starting with < or >', () => {
    test('>:) >:( >:O >:P', () => {
        expect(kv('>:)')).toEqual([['EMOTICON', 'laughing']]);
        expect(kv('>:(')).toEqual([['EMOTICON', 'angry']]);
        expect(kv('>:O')).toEqual([['EMOTICON', 'open_mouth']]);
        expect(kv('>:P')).toEqual([['EMOTICON', 'stuck_out_tongue_winking_eye']]);
    });

    test('<3 and </3', () => {
        expect(kv('<3')).toEqual([['EMOTICON', 'heart']]);
        expect(kv('</3')).toEqual([['EMOTICON', 'broken_heart']]);
    });
});

// ── timestamps ──────────────────────────────────────────────────────────────

describe('timestamps', () => {
    test('basic <t:unix>', () => {
        expect(kv('<t:1630360800>')).toEqual([['TIMESTAMP', '1630360800']]);
    });

    test('with format flag', () => {
        expect(kv('<t:1630360800:R>')).toEqual([['TIMESTAMP', '1630360800:R']]);
        expect(kv('<t:1630360800:F>')).toEqual([['TIMESTAMP', '1630360800:F']]);
    });

    test('not-quite timestamps fall back to angle brackets', () => {
        expect(kinds('<nottime>')).toEqual(['ANGLE_OPEN', 'TEXT', 'ANGLE_CLOSE']);
        expect(kinds('<text>')).toEqual(['ANGLE_OPEN', 'TEXT', 'ANGLE_CLOSE']);
        expect(kinds('<t:12345')).toEqual(['ANGLE_OPEN', 'TEXT']); // no closing >
        expect(kinds('<t:>')).toEqual(['ANGLE_OPEN', 'TEXT', 'ANGLE_CLOSE']); // empty
    });
});
