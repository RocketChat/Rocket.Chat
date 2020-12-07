import type { IUser, IUserEmail } from '../../definition/IUser';

export const getUserEmailAddress = (user: IUser): IUserEmail | undefined =>
	(Array.isArray(user.emails) ? user.emails.find(({ address }) => !!address) : undefined);
