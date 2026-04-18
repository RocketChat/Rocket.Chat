import { parse } from '../../src';
import { tokenize } from '../../src/lexer';
import { TokenKind } from '../../src/lexer/Token';

const kinds = (tokens: { kind: TokenKind }[]) => tokens.map((t) => t.kind).filter((k) => k !== TokenKind.EOF);

describe('handwritten lexer option plumbing', () => {
    test('parse() handwritten mode disables option-gated features by default', () => {
        const emoticonKinds = kinds(parse(':)', { engine: 'handwritten' }) as { kind: TokenKind }[]);
        const colorKinds = kinds(parse('color:#ff0000', { engine: 'handwritten' }) as { kind: TokenKind }[]);
        const dollarKinds = kinds(parse('$x$', { engine: 'handwritten' }) as { kind: TokenKind }[]);
        const parenthesisKinds = kinds(parse('\\(x\\)', { engine: 'handwritten' }) as { kind: TokenKind }[]);

        expect(emoticonKinds).toEqual([TokenKind.TEXT]);
        expect(colorKinds).toEqual([TokenKind.TEXT]);
        expect(dollarKinds).toEqual([TokenKind.TEXT]);
        expect(parenthesisKinds).toEqual([TokenKind.TEXT]);
    });

    test('parse() handwritten mode honors explicit feature flags', () => {
        const emoticonKinds = kinds(parse(':)', { engine: 'handwritten', emoticons: true }) as { kind: TokenKind }[]);
        const colorKinds = kinds(parse('color:#ff0000', { engine: 'handwritten', colors: true }) as { kind: TokenKind }[]);
        const dollarKinds = kinds(
            parse('$x$', { engine: 'handwritten', katex: { dollarSyntax: true } }) as { kind: TokenKind }[],
        );
        const parenthesisKinds = kinds(
            parse('\\(x\\)', { engine: 'handwritten', katex: { parenthesisSyntax: true } }) as { kind: TokenKind }[],
        );
        const customDomainKinds = kinds(
            parse('gitlab.local', { engine: 'handwritten', customDomains: ['local'] }) as { kind: TokenKind }[],
        );

        expect(emoticonKinds).toEqual([TokenKind.EMOTICON]);
        expect(colorKinds).toEqual([TokenKind.COLOR]);
        expect(dollarKinds).toEqual([TokenKind.KATEX_INLINE_START, TokenKind.TEXT, TokenKind.KATEX_INLINE_END]);
        expect(parenthesisKinds).toEqual([TokenKind.KATEX_INLINE_START, TokenKind.TEXT, TokenKind.KATEX_INLINE_END]);
        expect(customDomainKinds).toEqual([TokenKind.URL]);
    });

    test('tokenize() keeps handwritten-lexer defaults for direct usage', () => {
        expect(kinds(tokenize(':)'))).toEqual([TokenKind.EMOTICON]);
        expect(kinds(tokenize('color:#ff0000'))).toEqual([TokenKind.COLOR]);
        expect(kinds(tokenize('$x$'))).toEqual([TokenKind.KATEX_INLINE_START, TokenKind.TEXT, TokenKind.KATEX_INLINE_END]);
    });
});
