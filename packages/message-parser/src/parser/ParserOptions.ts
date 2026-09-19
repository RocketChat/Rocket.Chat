import type { ResolvedLexerOptions } from '../lexer/Options';

export type ParserOptions = {
	colors: boolean;
	emoticons: boolean;
	katexDollarSyntax: boolean;
	katexParenthesisSyntax: boolean;
	customDomains: string[];
};

/**
 * Builds resolved parser options from already-resolved lexer options.
 * The parser inherits all lexer option values since they control feature
 * gating at both the tokenization and AST-building layers.
 */
export function resolveParserOptions(lexerOpts: ResolvedLexerOptions): ParserOptions {
	return {
		colors: lexerOpts.colors,
		emoticons: lexerOpts.emoticons,
		katexDollarSyntax: lexerOpts.katexDollarSyntax,
		katexParenthesisSyntax: lexerOpts.katexParenthesisSyntax,
		customDomains: lexerOpts.customDomains,
	};
}
