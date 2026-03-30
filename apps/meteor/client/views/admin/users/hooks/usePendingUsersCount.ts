import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

const usePendingUsersCount = () => {
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');

	return useQuery({
		queryKey: ['pendingUsersCount'],

		queryFn: async () => {
			const payload: UsersListStatusParamsGET = {
				hasLoggedIn: false,
				type: 'user',
				count: 1,
			};

			return getUsers(payload);
		},
		select: (data) => data?.total,
	});
};

export default usePendingUsersCount;
