import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import type { usePagination, useSort } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { AdminUsersTab, UsersTableSortingOption } from '../AdminUsersPage';

type UseFilteredUsersOptions = {
	searchTerm: string;
	prevSearchTerm: MutableRefObject<string>;
	tab: AdminUsersTab;
	paginationData: ReturnType<typeof usePagination>;
	sortData: ReturnType<typeof useSort<UsersTableSortingOption>>;
	selectedRoles: string[];
};

const useFilteredUsers = ({ searchTerm, prevSearchTerm, sortData, paginationData, tab, selectedRoles }: UseFilteredUsersOptions) => {
	const { setCurrent, itemsPerPage, current } = paginationData;
	const { sortBy, sortDirection } = sortData;

	const payload = useMemo(() => {
		if (searchTerm !== prevSearchTerm.current) {
			setCurrent(0);
		}

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
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			count: itemsPerPage,
			offset: searchTerm === prevSearchTerm.current ? current : 0,
		};
	}, [current, itemsPerPage, prevSearchTerm, searchTerm, selectedRoles, setCurrent, sortBy, sortDirection, tab]);
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');
	const usersListQueryResult = useQuery({
		queryKey: ['users.list', payload, tab],
		queryFn: async () => getUsers(payload),
		meta: {
			apiErrorToastMessage: true,
		},
	});
	return usersListQueryResult;
};
export default useFilteredUsers;
