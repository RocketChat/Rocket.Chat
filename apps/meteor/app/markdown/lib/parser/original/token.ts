/*
 * Markdown is a named function that will parse markdown syntax
 * @param {String} msg - The message html
 */
import type { IMessage, TokenType, TokenExtra } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

export const addAsToken = (message: IMessage, html: string, type: TokenType, extra?: TokenExtra): string => {
	if (!message.tokens) {
		message.tokens = [];
	}
	const token = `=!=${Random.id()}=!=`;
	message.tokens.push({
		token,
		type,
		text: html,
		...(extra && { ...extra }),
	});

	return token;
};

export const isToken = (msg: string): boolean => /=!=[.a-z0-9]{17}=!=/gim.test(msg.trim());

export const validateAllowedTokens = (message: IMessage, id: string, desiredTokens: TokenType[]): boolean => {
	const tokens: string[] = id.match(/=!=[.a-z0-9]{17}=!=/gim) || [];
	const tokensFound = message.tokens?.filter(({ token }) => tokens.includes(token)) || [];
	return tokensFound.length === 0 || tokensFound.every((token) => token.type && desiredTokens.includes(token.type));
};
