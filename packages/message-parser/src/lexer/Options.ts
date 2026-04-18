export type LexerOptions = {
    colors?: boolean;
    emoticons?: boolean;
    katex?: {
        dollarSyntax?: boolean;
        parenthesisSyntax?: boolean;
    };
    customDomains?: string[];
};

export type ResolvedLexerOptions = {
    colors: boolean;
    emoticons: boolean;
    katexDollarSyntax: boolean;
    katexParenthesisSyntax: boolean;
    customDomains: string[];
};

/**
 * Resolves optional lexer options to concrete booleans.
 *
 * Defaults preserve the current handwritten lexer behavior. The parser entrypoint
 * can pass stricter values to match legacy parser semantics.
 */
export const resolveLexerOptions = (options?: LexerOptions): ResolvedLexerOptions => ({
    colors: options?.colors ?? true,
    emoticons: options?.emoticons ?? true,
    katexDollarSyntax: options?.katex?.dollarSyntax ?? true,
    katexParenthesisSyntax: options?.katex?.parenthesisSyntax ?? true,
    customDomains: options?.customDomains ?? [],
});
