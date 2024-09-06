import type { Root } from './definitions';
import * as grammar from './grammar.pegjs';
import { type Options, Tracer } from './tracer';

export * from './definitions';

export { isNodeOfType } from './guards';

export const parse = (input: string, options?: Options): Root => {
  const parserOptions = Tracer.createParserOptions(options);

  const result = grammar.parse(input, parserOptions);
  return result;
};

export {
  /** @deprecated */
  parse as parser,
  /** @deprecated */
  Root as MarkdownAST,
  Options,
};
