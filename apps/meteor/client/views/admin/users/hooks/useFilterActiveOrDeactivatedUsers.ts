import type { IUser } from '@rocket.chat/core-typings';

export const useFilterActiveOrDeactivatedUsers = (
	users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag'>[] | undefined,
	tab: string,
) => {
	if (!users || (tab !== 'active' && tab !== 'deactivated')) return [];

	return tab === 'active' ? users.filter((currentUser) => currentUser.active) : users.filter((currentUser) => !currentUser.active);
};
