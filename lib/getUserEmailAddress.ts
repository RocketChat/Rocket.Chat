import type { IUser } from '../definition/IUser';

export const getUserEmailAddress = (user: IUser): string | undefined =>
	(Array.isArray(user.emails) ? user.emails.find(({ address }) => !!address)?.address : undefined);
