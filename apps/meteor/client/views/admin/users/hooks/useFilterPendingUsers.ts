import type { IUser } from '@rocket.chat/core-typings';

export const useFilterPendingUsers = (
	users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag' | 'lastLogin'>[] | undefined,
	tab: string,
) => {
	if (!users || tab !== 'pending') return [];

	return users.filter((currentUser) => currentUser.active === false || !currentUser.lastLogin);
};
