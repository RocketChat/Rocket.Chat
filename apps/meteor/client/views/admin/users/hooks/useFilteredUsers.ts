import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';
import type { AdminUserTab, UsersTableSortingOptions } from '../AdminUsersPage';

type UseFilteredUsersOptions = {
	searchTerm: string;
	prevSearchTerm: MutableRefObject<string>;
	tab: AdminUserTab;
	paginationData: ReturnType<typeof usePagination>;
	sortData: ReturnType<typeof useSort<UsersTableSortingOptions>>;
	selectedRoles: string[];
};

const useFilteredUsers = ({ searchTerm, prevSearchTerm, sortData, paginationData, tab, selectedRoles }: UseFilteredUsersOptions) => {
	const { setCurrent, itemsPerPage, current } = paginationData;
	const { sortBy, sortDirection } = sortData;

	const payload = useMemo(() => {
		if (searchTerm !== prevSearchTerm.current) {
			setCurrent(0);
		}

		const listUsersPayload: Partial<Record<AdminUserTab, UsersListStatusParamsGET>> = {
			all: {},
			pending: {
				hasLoggedIn: false,
				type: 'user',
			},
			active: {
				hasLoggedIn: true,
				status: 'active',
			},
			deactivated: {
				hasLoggedIn: true,
				status: 'deactivated',
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
	const dispatchToastMessage = useToastMessageDispatch();
	const usersListQueryResult = useQuery(['users.list', payload, tab], async () => getUsers(payload), {
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
	return usersListQueryResult;
};
export default useFilteredUsers;
