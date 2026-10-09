import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { usePaginatedQueryKey } from '@rocket.chat/ui-client';
import type { useSort } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { AdminUsersTab, UsersTableSortingOption } from '../AdminUsersPage';

type UseFilteredUsersOptions = {
	searchTerm: string;
	prevSearchTerm: MutableRefObject<string>;
	tab: AdminUsersTab;
	sortData: ReturnType<typeof useSort<UsersTableSortingOption>>;
	selectedRoles: string[];
};

const useFilteredUsers = ({ searchTerm, prevSearchTerm, sortData, tab, selectedRoles }: UseFilteredUsersOptions) => {
	const { sortBy, sortDirection } = sortData;

	const payload = useMemo(() => {
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
		};
	}, [searchTerm, selectedRoles, sortBy, sortDirection, tab]);
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query: payload,
		getQueryKey: (query) => ['users.list', query, tab] as const,
	});

	if (searchTerm !== prevSearchTerm.current && paginationProps.current !== 0) {
		paginationProps.onSetCurrent(0);
	}

	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');
	const usersListQueryResult = useQuery({
		queryKey,
		queryFn: async () => getUsers(paginatedQuery),
		meta: {
			apiErrorToastMessage: true,
		},
	});
	return { usersListQueryResult, paginationProps };
};
export default useFilteredUsers;
