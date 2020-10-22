import type { IUser } from '../../definition/IUser';

export const getUserEmailAddress = (user: IUser): string | undefined =>
	user.emails?.find(({ address }) => !!address)?.address;
