import type { Root } from './definitions';
import { parse as _parse } from './parser';

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
};

export const parse = (input: string, options?: Options): Root => _parse(input, options);

export type { Root as MarkdownAST };
export { parse as parser };
