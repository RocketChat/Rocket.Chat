import type { MarkdownAST } from '@rocket.chat/message-parser';

// Emoji-only text is parsed as BIG_EMOJI; outside chat-like text it must stay at text size.
export const inlineBigEmoji = (tokens: MarkdownAST): MarkdownAST =>
	tokens.map((token) => (token.type === 'BIG_EMOJI' ? { type: 'PARAGRAPH', value: token.value } : token));
