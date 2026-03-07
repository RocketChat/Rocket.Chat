import { Lexer } from '../src/lexer/lexer';
import { TokenKind } from '../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);

describe('asterisk', () => {
    test('bold markers', () => {
        expect(kv('**bold**')).toEqual([
            ['ASTERISK', '**'], ['TEXT', 'bold'], ['ASTERISK', '**'],
        ]);
    });

    test('single * between words', () => {
        expect(kinds('a*b')).toEqual(['TEXT', 'ASTERISK', 'TEXT']);
    });

    test('runs of 3 and 4 stars', () => {
        expect(kv('***')).toEqual([['ASTERISK', '***']]);
        expect(kv('****')).toEqual([['ASTERISK', '****']]);
    });

    test('* becomes a list bullet at the start of a line', () => {
        expect(kinds('* item')).toEqual(['UL_BULLET', 'TEXT']);
        expect(kinds('*\titem')).toEqual(['UL_BULLET', 'TEXT']);
    });

    test('* mid-line is emphasis, not a bullet', () => {
        expect(kinds('text * item')).toEqual([
            'TEXT', 'WHITESPACE', 'ASTERISK', 'WHITESPACE', 'TEXT',
        ]);
    });

    test('after a newline it counts as line-start again', () => {
        expect(kinds('line1\n* item')).toEqual(['TEXT', 'NEWLINE', 'UL_BULLET', 'TEXT']);
        expect(kinds('line\r* item')).toEqual(['TEXT', 'NEWLINE', 'UL_BULLET', 'TEXT']);
    });

    test('just a lone *', () => {
        expect(kinds('*')).toEqual(['ASTERISK']);
    });

    test('emoticon fallback: *) and *-)', () => {
        expect(kv('*)')).toEqual([['EMOTICON', 'wink']]);
        expect(kv('*-)')).toEqual([['EMOTICON', 'wink']]);
    });
});

describe('underscore', () => {
    test('italic markers', () => {
        expect(kinds('_italic_')).toEqual(['UNDERSCORE', 'TEXT', 'UNDERSCORE']);
    });

    test('double and triple runs', () => {
        expect(kv('__bold__')).toEqual([
            ['UNDERSCORE', '__'], ['TEXT', 'bold'], ['UNDERSCORE', '__'],
        ]);
        expect(kv('___')).toEqual([['UNDERSCORE', '___']]);
    });

    test('inside identifier-style text like some_var', () => {
        expect(kinds('some_var')).toEqual(['TEXT', 'UNDERSCORE', 'TEXT']);
        expect(kinds('a__b__c')).toEqual(['TEXT', 'UNDERSCORE', 'TEXT', 'UNDERSCORE', 'TEXT']);
    });

    test('lone _', () => {
        expect(kinds('_')).toEqual(['UNDERSCORE']);
    });
});

describe('tilde', () => {
    test('strikethrough markers', () => {
        expect(kv('~~struck~~')).toEqual([
            ['TILDE', '~~'], ['TEXT', 'struck'], ['TILDE', '~~'],
        ]);
    });

    test('single tilde and triple run', () => {
        expect(kinds('~x~')).toEqual(['TILDE', 'TEXT', 'TILDE']);
        expect(kv('~~~')).toEqual([['TILDE', '~~~']]);
    });

    test('tilde buried in text', () => {
        expect(kinds('approx~value')).toEqual(['TEXT', 'TILDE', 'TEXT']);
    });
});

describe('mixing formatting markers', () => {
    test('bold inside italic', () => {
        expect(kinds('_**bold**_')).toEqual([
            'UNDERSCORE', 'ASTERISK', 'TEXT', 'ASTERISK', 'UNDERSCORE',
        ]);
    });

    test('strikethrough wrapping bold', () => {
        expect(kinds('~~**text**~~')).toEqual([
            'TILDE', 'ASTERISK', 'TEXT', 'ASTERISK', 'TILDE',
        ]);
    });

    test('all three adjacent', () => {
        expect(kinds('*_~')).toEqual(['ASTERISK', 'UNDERSCORE', 'TILDE']);
    });

    test('* at line-start + space turns into bullet, rest are markers', () => {
        expect(kinds('* _ ~')).toEqual(['UL_BULLET', 'UNDERSCORE', 'WHITESPACE', 'TILDE']);
    });
});
