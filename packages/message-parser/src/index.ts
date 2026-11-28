import type { Root } from './definitions.js';
import * as grammar from './grammar.pegjs';

export type * from './definitions.js';

export { isNodeOfType } from './guards.js';

export { asciiList } from './asciiList.js';

export type Options = {
	colors?: boolean;
	emoticons?: boolean;
	katex?: {
		dollarSyntax?: boolean;
		parenthesisSyntax?: boolean;
	};
	customDomains?: string[];
};

export const parse = (input: string, options?: Options): Root => grammar.parse(input, options);

export type { Root as MarkdownAST };
export { parse as parser };
