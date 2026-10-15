import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import type { useSort } from '@rocket.chat/ui-client';
import { usePagination } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
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

	const { paginatedQuery, queryKey, ...paginationData } = usePagination({ query, getQueryKey: (query) => ['users.list', query, tab] });
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');
	const usersListQueryResult = useQuery({
		queryKey,
		queryFn: async () => getUsers(paginatedQuery),
		meta: {
			apiErrorToastMessage: true,
		},
	});
	return { usersListQueryResult, paginationData };
};
export default useFilteredUsers;
