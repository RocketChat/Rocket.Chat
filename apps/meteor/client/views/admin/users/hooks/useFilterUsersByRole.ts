import type { IUser } from '@rocket.chat/core-typings';

export const useFilterUsersByRole = (users: Partial<IUser>[], selectedRoles: string[]) => {
	if (!users.length || !selectedRoles.length || selectedRoles.includes('all')) return users;

	return users.filter((currentUser) => {
		return currentUser.roles?.some((currentRole) => selectedRoles.includes(currentRole));
	});
};
