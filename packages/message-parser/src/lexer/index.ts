export { Lexer } from './lexer';
export { Token, TokenKind, makeToken } from './Token';
export type { LexerOptions } from './Options';

import { Lexer } from './lexer';
import type { Token } from './Token';
import type { LexerOptions } from './Options';

export const tokenize = (input: string, options?: LexerOptions): Token[] => new Lexer(input, options).tokenize();
