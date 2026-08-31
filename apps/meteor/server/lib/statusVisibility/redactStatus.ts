import type { IUser } from '@rocket.chat/core-typings';

export const redactStatus = <T extends Partial<IUser>>(user: T): T => {
	const { statusText, statusSource, statusExpiresAt, statusDefault, statusConnection, ...rest } = user;

	return { ...rest, status: 'offline' } as T;
};
