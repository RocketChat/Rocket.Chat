import type { IUser } from '@rocket.chat/core-typings';

export const useFilterUsersByRole = (
	users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag' | 'lastLogin'>[],
	selectedRoles: string[],
) => {
	if (!users.length || !selectedRoles.length || selectedRoles.includes('all')) return users;

	return users.filter((currentUser) => {
		return currentUser.roles?.some((currentRole) => selectedRoles.includes(currentRole));
	});
};
