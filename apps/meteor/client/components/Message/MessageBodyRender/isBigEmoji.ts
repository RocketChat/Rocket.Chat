import { BigEmoji as ASTBigEmoji, MarkdownAST } from '@rocket.chat/message-parser';

export const isBigEmoji = (tokens: MarkdownAST): tokens is [ASTBigEmoji] => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';
