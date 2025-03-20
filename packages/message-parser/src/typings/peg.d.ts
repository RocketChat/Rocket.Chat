declare module '*.pegjs' {
  import type { ParserOptions } from 'peggy';

  import type { ASTMessage } from '../definitions';

  export const parse: (input: string, options?: ParserOptions) => ASTMessage;
}
