export { Lexer } from './lexer';
export { Token, TokenKind, makeToken } from './Token';

import { Lexer } from './lexer';
import type { Token } from './Token';

export const tokenize = (input: string): Token[] => new Lexer(input).tokenize();
