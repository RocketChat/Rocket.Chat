import type { Root } from './definitions';
import * as grammar from './grammar.pegjs';

export * from './definitions';

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

export const parse = (input: string, options?: Options): Root =>
  grammar.parse(input, options);

export {
  /** @deprecated */
  parse as parser,
  /** @deprecated */
  Root as MarkdownAST,
};
