import type { IUser } from '@rocket.chat/core-typings';

export const useFilterPendingUsers = (users: Partial<IUser>[] | undefined, tab: string) => {
	if (!users || tab !== 'pending') return [];

	return users.filter((currentUser) => currentUser.active === false || !currentUser.lastLogin);
};
