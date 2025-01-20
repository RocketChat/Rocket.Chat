import type { Serialized } from '@rocket.chat/core-typings';
import type { DefaultUserInfo, UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

const usePendingUsersCount = (users: Serialized<DefaultUserInfo[]> | undefined) => {
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');

	return useQuery({
		queryKey: ['pendingUsersCount', users],

		queryFn: async () => {
			const payload: UsersListStatusParamsGET = {
				hasLoggedIn: false,
				status: 'deactivated',
				type: 'user',
				count: 1,
			};

			return getUsers(payload);
		},

		enabled: !!users,
		select: (data) => data?.total,
	});
};

export default usePendingUsersCount;
