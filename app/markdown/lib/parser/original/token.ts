/*
 * Markdown is a named function that will parse markdown syntax
 * @param {String} msg - The message html
 */
import { Random } from 'meteor/random';

import { IMessage } from '../../../../../definition/IMessage';

type TokenType = 'code' | 'inlinecode' | 'bold' | 'italic' | 'strike' | 'link';
type Token = {
	token: string;
	type: TokenType;
	text: string;
	noHtml?: string;
} & TokenExtra;

type TokenExtra = {
	highlight?: boolean;
	noHtml?: string;
};

export const addAsToken = (message: IMessage & { tokens: Token[] }, html: string, type: TokenType, extra?: TokenExtra): string => {
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

export const validateAllowedTokens = (message: IMessage & { tokens: Token[] }, id: string, desiredTokens: TokenType[]): boolean => {
	const tokens = id.match(/=!=[.a-z0-9]{17}=!=/gim) || [];
	const tokensFound = message.tokens.filter(({ token }) => tokens.includes(token));
	return tokensFound.length === 0 || tokensFound.every((token) => desiredTokens.includes(token.type));
};

export const validateForbiddenTokens = (message: IMessage & { tokens: Token[] }, id: string, desiredTokens: TokenType[]): boolean => {
	const tokens = id.match(/=!=[.a-z0-9]{17}=!=/gim) || [];
	const tokensFound = message.tokens.filter(({ token }) => tokens.includes(token));
	return tokensFound.length === 0 || !tokensFound.some((token) => desiredTokens.includes(token.type));
};
