import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

const usePendingUsersCount = (currentUsersTotal: number | undefined) => {
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');

	return useQuery(
		['pendingUsersCount', currentUsersTotal],
		async () => {
			const payload: UsersListStatusParamsGET = {
				status: 'pending',
				count: 1,
			};

			return getUsers(payload);
		},
		{ select: (data) => data?.total },
	).data;
};

export default usePendingUsersCount;
