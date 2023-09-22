import type { IUser } from '@rocket.chat/core-typings';

export const useFilterActiveUsers = (users: Partial<IUser>[] | undefined, tab: string) => {
	if (!users || tab !== 'active') return [];

	return users.filter((currentUser) => currentUser.active);
};
