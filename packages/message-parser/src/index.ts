import type { Root } from './definitions';
import * as grammar from './grammar.pegjs';
import { tokenize } from './lexer';
import type { LexerOptions } from './lexer';
import { resolveLexerOptions } from './lexer/Options';
import { Parser, resolveParserOptions } from './parser';

export type * from './definitions';

export { isNodeOfType } from './guards';

export type Options = {
	colors?: boolean;
	emoticons?: boolean;
	katex?: {
		dollarSyntax?: boolean;
		parenthesisSyntax?: boolean;
	};
	customDomains?: string[];
	// Which parser to use. Defaults to 'peggy'.
	engine?: 'peggy' | 'handwritten';
};

export function parse(input: string, options?: Options): Root {
	if (options?.engine === 'handwritten') {
		const lexerOptions: LexerOptions = {
			colors: options.colors ?? false,
			emoticons: options.emoticons ?? false,
			katex: {
				dollarSyntax: options.katex?.dollarSyntax ?? false,
				parenthesisSyntax: options.katex?.parenthesisSyntax ?? false,
			},
			customDomains: options.customDomains,
		};
		const tokens = tokenize(input, lexerOptions);
		const resolved = resolveLexerOptions(lexerOptions);
		const parserOpts = resolveParserOptions(resolved);
		return new Parser(tokens, parserOpts).parse();
	}

	return grammar.parse(input, options);
}

export {
	/** @deprecated */
	parse as parser,
};

export type {
	/** @deprecated */
	Root as MarkdownAST,
};

// Handwritten lexer
export { Lexer, Token, TokenKind, makeToken, tokenize } from './lexer';

// Handwritten parser
export { Parser, TokenStream, resolveParserOptions } from './parser';
export type { ParserOptions } from './parser';