import type { UsersEndpoints } from '@rocket.chat/rest-typings';

export const useFilterActiveUsers = (users: ReturnType<UsersEndpoints['/v1/users.list']['GET']>['users'] | undefined, tab: string) => {
	if (!users || tab !== 'active') return [];

	return users.filter((currentUser) => currentUser.active);
};
