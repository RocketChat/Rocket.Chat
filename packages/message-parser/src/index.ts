import type { Root } from './definitions';
import * as grammar from './grammar.pegjs';
import { tokenize } from './lexer';
import type { Token } from './lexer';

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

export function parse(input: string, options?: Options): Root | Token[] {
	if (options?.engine === 'handwritten') {
		const tokens = tokenize(input);
		// TODO: once the handwritten parser is ready, pass tokens through it instead of returning them raw
		return tokens;
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