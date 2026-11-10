import type { IPersonalAccessToken, Serialized } from '@rocket.chat/core-typings';

export type PersonalAccessToken = Serialized<Pick<IPersonalAccessToken, 'name' | 'createdAt' | 'lastTokenPart' | 'bypassTwoFactor'>>;

export type NewPersonalAccessToken = {
	tokenName: string;
	bypassTwoFactor: boolean;
};

export const isValidTokenName = (name: string): boolean => name.trim().length > 0;

// An offset past the end (e.g. after removing the last token of a page) falls back to the last page.
export const getTokensPage = <T>(tokens: readonly T[], offset: number, itemsPerPage: number): T[] => {
	const start = offset > tokens.length ? Math.max(0, tokens.length - itemsPerPage) : offset;
	return tokens.slice(start, start + itemsPerPage);
};
