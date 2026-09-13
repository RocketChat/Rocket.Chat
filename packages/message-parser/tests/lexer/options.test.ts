import { tokenize } from '../../src/lexer';
import { TokenKind } from '../../src/lexer/Token';

const kinds = (tokens: { kind: TokenKind }[]) => tokens.map((t) => t.kind).filter((k) => k !== TokenKind.EOF);

describe('handwritten lexer option plumbing', () => {
    test('tokenize() disables option-gated features when explicitly set to false', () => {
        const emoticonKinds = kinds(tokenize(':)', { emoticons: false }));
        const colorKinds = kinds(tokenize('color:#ff0000', { colors: false }));
        const dollarKinds = kinds(tokenize('$x$', { katex: { dollarSyntax: false } }));
        const parenthesisKinds = kinds(tokenize('\\(x\\)', { katex: { parenthesisSyntax: false } }));

        expect(emoticonKinds).toEqual([TokenKind.TEXT]);
        expect(colorKinds).toEqual([TokenKind.TEXT]);
        expect(dollarKinds).toEqual([TokenKind.TEXT]);
        expect(parenthesisKinds).toEqual([TokenKind.TEXT]);
    });

    test('tokenize() honors explicit feature flags', () => {
        const emoticonKinds = kinds(tokenize(':)', { emoticons: true }));
        const colorKinds = kinds(tokenize('color:#ff0000', { colors: true }));
        const dollarKinds = kinds(tokenize('$x$', { katex: { dollarSyntax: true } }));
        const parenthesisKinds = kinds(tokenize('\\(x\\)', { katex: { parenthesisSyntax: true } }));
        const customDomainKinds = kinds(tokenize('gitlab.local', { customDomains: ['local'] }));

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
