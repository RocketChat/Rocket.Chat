import { Lexer } from '../../src/lexer/lexer';
import { TokenKind } from '../../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);
const raw = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => t.raw).join('');

describe('inline code', () => {
    test('wraps content between backticks', () => {
        expect(kinds('`code`')).toEqual(['BACKTICK', 'CODE_CONTENT', 'BACKTICK']);
    });

    test('does not tokenize formatting inside code', () => {
        expect(kinds('`**not bold**`')).toEqual(['BACKTICK', 'CODE_CONTENT', 'BACKTICK']);
        expect(kinds('`:smile:`')).toEqual(['BACKTICK', 'CODE_CONTENT', 'BACKTICK']);
        expect(kinds('`https://example.com`')).toEqual(['BACKTICK', 'CODE_CONTENT', 'BACKTICK']);
    });

    test('preserves the content value', () => {
        expect(kv('`hello world`')).toEqual([
            ['BACKTICK', '`'], ['CODE_CONTENT', 'hello world'], ['BACKTICK', '`'],
        ]);
    });

    test('two backticks back-to-back = empty code span', () => {
        expect(kinds('``')).toEqual(['BACKTICK', 'BACKTICK']);
    });

    test('code with just a space inside', () => {
        expect(kv('` `')).toEqual([
            ['BACKTICK', '`'], ['CODE_CONTENT', ' '], ['BACKTICK', '`'],
        ]);
    });

    test('unclosed at newline breaks out', () => {
        expect(kinds('`unclosed\ntext')).toEqual(['BACKTICK', 'TEXT', 'NEWLINE', 'TEXT']);
    });

    test('unclosed at EOF', () => {
        expect(kinds('`oops')).toEqual(['BACKTICK', 'TEXT']);
    });

    test('multiple code spans in one line', () => {
        expect(kinds('`a` and `b`')).toEqual([
            'BACKTICK', 'CODE_CONTENT', 'BACKTICK', 'WHITESPACE', 'TEXT', 'WHITESPACE',
            'BACKTICK', 'CODE_CONTENT', 'BACKTICK',
        ]);
    });
});

describe('fenced code blocks', () => {
    test('basic block with language tag', () => {
        expect(kinds('```js\nconsole.log();\n```')).toEqual([
            'TRIPLE_BACKTICK', 'CODE_CONTENT', 'TRIPLE_BACKTICK',
        ]);
    });

    test('block body is captured as one CODE_CONTENT token', () => {
        expect(kv('```\nhello\n```')).toEqual([
            ['TRIPLE_BACKTICK', '```'], ['CODE_CONTENT', '\nhello\n'], ['TRIPLE_BACKTICK', '```'],
        ]);
    });

    test('empty fenced block', () => {
        expect(kinds('```\n```')).toEqual(['TRIPLE_BACKTICK', 'CODE_CONTENT', 'TRIPLE_BACKTICK']);
    });

    test('six backticks = immediate open + close', () => {
        expect(kinds('``````')).toEqual(['TRIPLE_BACKTICK', 'TRIPLE_BACKTICK']);
    });

    test('unclosed fenced block consumes to EOF', () => {
        expect(kinds('```js\ncode here')).toEqual(['TRIPLE_BACKTICK', 'CODE_CONTENT']);
    });

    test('backticks inside a fenced block stay as content', () => {
        expect(kinds('```\n`inner`\n```')).toEqual([
            'TRIPLE_BACKTICK', 'CODE_CONTENT', 'TRIPLE_BACKTICK',
        ]);
    });

    test('nothing inside a fenced block gets tokenized', () => {
        expect(kinds('```\n**bold** :smile: @user\n```')).toEqual([
            'TRIPLE_BACKTICK', 'CODE_CONTENT', 'TRIPLE_BACKTICK',
        ]);
    });

    test('text before and after a fenced block', () => {
        expect(kinds('before ```\ncode\n``` after')).toEqual([
            'TEXT', 'WHITESPACE', 'TRIPLE_BACKTICK', 'CODE_CONTENT',
            'TRIPLE_BACKTICK', 'WHITESPACE', 'TEXT',
        ]);
    });
});

describe('code round-trips', () => {
    test.each([
        '`hello`',
        '`unclosed',
        '```js\nfoo();\n```',
        '```\nunclosed',
        '``',
    ])('%s', (input) => {
        expect(raw(input)).toBe(input);
    });
});
