import type { IUser } from '@rocket.chat/core-typings';

export const getUserEmailAddress = (user: Pick<IUser, 'emails'>): string | undefined =>
	Array.isArray(user.emails) ? user.emails.find(({ address }) => !!address)?.address : undefined;
