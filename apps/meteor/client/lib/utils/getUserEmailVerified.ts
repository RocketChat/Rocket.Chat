import type { IUser } from '../../../definition/IUser';

export const getUserEmailVerified = (user: IUser): boolean | undefined =>
	Array.isArray(user.emails) ? user.emails.find(({ verified }) => !!verified)?.verified : undefined;
