import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import type { useSort } from '@rocket.chat/ui-client';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { AdminUsersTab, UsersTableSortingOption } from '../AdminUsersPage';

type UseFilteredUsersOptions = {
	searchTerm: string;
	tab: AdminUsersTab;
	sortData: ReturnType<typeof useSort<UsersTableSortingOption>>;
	selectedRoles: string[];
	statusManagement?: UsersListStatusParamsGET['statusManagement'];
};

const useFilteredUsers = ({ searchTerm, sortData, tab, selectedRoles, statusManagement }: UseFilteredUsersOptions) => {
	const { sortBy, sortDirection } = sortData;

	const query = useMemo(() => {
		const listUsersPayload: Partial<Record<AdminUsersTab, UsersListStatusParamsGET>> = {
			all: {},
			pending: {
				type: 'user',
				status: 'deactivated',
				inactiveReason: ['pending_approval'],
			},
			active: {
				status: 'active',
			},
			deactivated: {
				status: 'deactivated',
				inactiveReason: ['deactivated', 'idle_too_long'],
			},
		};

		return {
			...listUsersPayload[tab],
			searchTerm,
			roles: selectedRoles,
			...(statusManagement && { statusManagement }),
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
		};
	}, [searchTerm, selectedRoles, sortBy, sortDirection, statusManagement, tab]);

	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');
	const usersListQueryResult = usePaginatedQuery({
		query,
		getQueryKey: (query) => ['users.list', query, tab],
		queryFn: getUsers,
		itemsKey: 'users',
		meta: {
			apiErrorToastMessage: true,
		},
	});
	return { usersListQueryResult, paginationData: usersListQueryResult.paginationProps };
};
export default useFilteredUsers;
