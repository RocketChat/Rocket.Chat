import type { IUser } from '@rocket.chat/core-typings';

export const getUserEmailVerified = (user: Pick<IUser, 'emails'>): boolean | undefined =>
	Array.isArray(user.emails) ? user.emails.find(({ verified }) => !!verified)?.verified : undefined;
