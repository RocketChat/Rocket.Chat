import type { Serialized } from '@rocket.chat/core-typings';
import type { PickedUser, UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

const usePendingUsersCount = (users: Serialized<PickedUser[]> | undefined) => {
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');

	return useQuery(
		['pendingUsersCount', users],
		async () => {
			const payload: UsersListStatusParamsGET = {
				hasLoggedIn: false,
				status: 'deactivated',
				type: 'user',
				count: 1,
			};

			return getUsers(payload);
		},
		{ select: (data) => data?.total },
	).data;
};

export default usePendingUsersCount;
