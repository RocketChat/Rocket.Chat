import { Lexer } from '../../src/lexer/lexer';
import { TokenKind } from '../../src/lexer/Token';

const tok = (s: string) => new Lexer(s).tokenize();
const kinds = (s: string) => tok(s).map(t => t.kind).filter(k => k !== TokenKind.EOF);
const kv = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => [t.kind, t.value] as const);
const raw = (s: string) =>
    tok(s).filter(t => t.kind !== TokenKind.EOF).map(t => t.raw).join('');

// ── inline $ ────────────────────────────────────────────────────────────────

describe('inline KaTeX ($)', () => {
    test('basic open/close pair', () => {
        expect(kinds('$x^2$')).toEqual(['KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END']);
    });

    test('toggles correctly across multiple spans', () => {
        expect(kinds('$a$ $b$')).toEqual([
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END', 'WHITESPACE',
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END',
        ]);
    });

    test('lone $ is just a start token', () => {
        expect(kinds('$')).toEqual(['KATEX_INLINE_START']);
    });

    test('$ space $ → open/close pair', () => {
        expect(kinds('$ $')).toEqual(['KATEX_INLINE_START', 'WHITESPACE', 'KATEX_INLINE_END']);
    });

    test('$$$ is block-start then inline-start', () => {
        expect(kinds('$$$')).toEqual(['KATEX_BLOCK_START', 'KATEX_INLINE_START']);
    });

    test('complex expression inside', () => {
        expect(kinds('$\\frac{a}{b}$')).toEqual([
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END',
        ]);
    });
});

// ── block $$ ────────────────────────────────────────────────────────────────

describe('block KaTeX ($$)', () => {
    test('basic pair', () => {
        expect(kinds('$$E=mc^2$$')).toEqual(['KATEX_BLOCK_START', 'TEXT', 'KATEX_BLOCK_END']);
    });

    test('toggles across multiple blocks', () => {
        expect(kinds('$$a$$ $$b$$')).toEqual([
            'KATEX_BLOCK_START', 'TEXT', 'KATEX_BLOCK_END', 'WHITESPACE',
            'KATEX_BLOCK_START', 'TEXT', 'KATEX_BLOCK_END',
        ]);
    });

    test('$$$$ = open then close', () => {
        expect(kinds('$$$$')).toEqual(['KATEX_BLOCK_START', 'KATEX_BLOCK_END']);
    });

    test('lone $$', () => {
        expect(kinds('$$')).toEqual(['KATEX_BLOCK_START']);
    });
});

// ── backslash delimiters ────────────────────────────────────────────────────

describe('backslash KaTeX delimiters', () => {
    test('\\[ and \\] for block', () => {
        expect(kinds('\\[E=mc^2\\]')).toEqual(['KATEX_BLOCK_START', 'TEXT', 'KATEX_BLOCK_END']);
        expect(kv('\\[a\\]')).toEqual([
            ['KATEX_BLOCK_START', '\\['], ['TEXT', 'a'], ['KATEX_BLOCK_END', '\\]'],
        ]);
    });

    test('\\( and \\) for inline', () => {
        expect(kinds('\\(x^2\\)')).toEqual(['KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END']);
        expect(kv('\\(a\\)')).toEqual([
            ['KATEX_INLINE_START', '\\('], ['TEXT', 'a'], ['KATEX_INLINE_END', '\\)'],
        ]);
    });
});

// ── mixing delimiters ───────────────────────────────────────────────────────

describe('mixing $ and backslash delimiters', () => {
    test('inline $ then block $$', () => {
        expect(kinds('$x$ $$y$$')).toEqual([
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END', 'WHITESPACE',
            'KATEX_BLOCK_START', 'TEXT', 'KATEX_BLOCK_END',
        ]);
    });

    test('backslash inline then dollar inline', () => {
        expect(kinds('\\(a\\) $b$')).toEqual([
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END', 'WHITESPACE',
            'KATEX_INLINE_START', 'TEXT', 'KATEX_INLINE_END',
        ]);
    });
});

// ── round-trips ─────────────────────────────────────────────────────────────

describe('KaTeX round-trips', () => {
    test.each([
        '$x^2$',
        '$$E=mc^2$$',
        '\\[a\\]',
        '\\(a\\)',
    ])('%s', (input) => {
        expect(raw(input)).toBe(input);
    });
});
