import { Lexer } from '../../src/lexer/lexer';
import { TokenKind } from '../../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);
const raw = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => t.raw).join('');

// ── newlines ────────────────────────────────────────────────────────────────

describe('newlines', () => {
    test('LF, CRLF, and CR are all recognized', () => {
        expect(kinds('a\nb')).toEqual(['TEXT', 'NEWLINE', 'TEXT']);
        expect(kinds('a\r\nb')).toEqual(['TEXT', 'NEWLINE', 'TEXT']);
        expect(kinds('a\rb')).toEqual(['TEXT', 'NEWLINE', 'TEXT']);
    });

    test('CRLF raw value includes both chars', () => {
        const tokens = tok('a\r\nb');
        const nl = tokens.find(t => t.kind === TokenKind.NEWLINE)!;
        expect(nl.raw).toBe('\r\n');
    });

    test('consecutive newlines each get their own token', () => {
        expect(kinds('\n\n')).toEqual(['NEWLINE', 'NEWLINE']);
        expect(kinds('\r\n\r\n')).toEqual(['NEWLINE', 'NEWLINE']);
    });

    test('mixed newline types', () => {
        // LF then CRLF then CR
        expect(kinds('a\nb\r\nc\rd')).toEqual([
            'TEXT', 'NEWLINE', 'TEXT', 'NEWLINE', 'TEXT', 'NEWLINE', 'TEXT',
        ]);
    });

    test('newline at the very start or end', () => {
        expect(kinds('\nhello')).toEqual(['NEWLINE', 'TEXT']);
        expect(kinds('hello\n')).toEqual(['TEXT', 'NEWLINE']);
    });

    test('just newlines', () => {
        expect(kinds('\n\n\n')).toEqual(['NEWLINE', 'NEWLINE', 'NEWLINE']);
    });
});

// ── whitespace ──────────────────────────────────────────────────────────────

describe('whitespace', () => {
    test('spaces and tabs get collapsed into one WHITESPACE token', () => {
        expect(kinds(' ')).toEqual(['WHITESPACE']);
        expect(kinds('    ')).toEqual(['WHITESPACE']);
        expect(kinds('\t')).toEqual(['WHITESPACE']);
        expect(kinds(' \t \t')).toEqual(['WHITESPACE']);
    });

    test('leading and trailing', () => {
        expect(kinds('  hello  ')).toEqual(['WHITESPACE', 'TEXT', 'WHITESPACE']);
    });

    test('just spaces', () => {
        expect(kinds('     ')).toEqual(['WHITESPACE']);
    });

    test('just tabs', () => {
        expect(kinds('\t\t')).toEqual(['WHITESPACE']);
    });
});

// ── escapes ─────────────────────────────────────────────────────────────────

describe('escape sequences', () => {
    test('escapable chars: * _ ~ ` # .', () => {
        expect(kv('\\*')).toEqual([['ESCAPED', '*']]);
        expect(kv('\\_')).toEqual([['ESCAPED', '_']]);
        expect(kv('\\~')).toEqual([['ESCAPED', '~']]);
        expect(kv('\\`')).toEqual([['ESCAPED', '`']]);
        expect(kv('\\#')).toEqual([['ESCAPED', '#']]);
        expect(kv('\\.')).toEqual([['ESCAPED', '.']]);
    });

    test('backslash before a letter or digit is just text', () => {
        expect(kinds('\\a')).toEqual(['TEXT']);
        expect(kinds('\\1')).toEqual(['TEXT']);
        expect(kinds('\\ ')).toEqual(['TEXT', 'WHITESPACE']);
    });

    test('backslash at EOF', () => {
        expect(kinds('\\')).toEqual(['TEXT']);
    });

    test('escape in context', () => {
        expect(kinds('a\\*b')).toEqual(['TEXT', 'ESCAPED', 'TEXT']);
    });

    test('multiple escapes in a row', () => {
        expect(kinds('\\*\\_\\~')).toEqual(['ESCAPED', 'ESCAPED', 'ESCAPED']);
    });

    test('escape followed by a formatting marker', () => {
        expect(kinds('\\**bold**')).toEqual(['ESCAPED', 'ASTERISK', 'TEXT', 'ASTERISK']);
    });
});

// ── round-trips ─────────────────────────────────────────────────────────────

describe('structural round-trips', () => {
    test.each([
        'a\nb\r\nc\rd',
        '  a\t\tb   ',
        '\\*\\_\\~\\`\\#\\.',
        '\\a\\1',
        'text\\',
    ])('%s', (input) => {
        expect(raw(input)).toBe(input);
    });
});
