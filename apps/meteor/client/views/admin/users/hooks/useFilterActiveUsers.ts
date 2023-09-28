import type { IUser } from '@rocket.chat/core-typings';

export const useFilterActiveUsers = (
	users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag' | 'lastLogin'>[] | undefined,
	tab: string,
) => {
	if (!users || tab !== 'active') return [];

	return users.filter((currentUser) => currentUser.active);
};
