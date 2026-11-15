import type { UsersListStatusParamsGET } from '@rocket.chat/rest-typings';
import type { useSort } from '@rocket.chat/ui-client';
import { usePaginatedQuery, usePagination } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { usersQueryKeys } from '../../../../lib/queryKeys';
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
			...(statusManagement && { statusManagement }),
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
		};
	}, [searchTerm, selectedRoles, sortBy, sortDirection, statusManagement, tab]);
	const queryKey = usersQueryKeys.list(payload, tab);
	const paginationData = usePagination({ resetKey: queryKey });
	const getUsers = useEndpoint('GET', '/v1/users.listByStatus');
	const usersListQueryResult = usePaginatedQuery({
		query: {
			queryKey,
			queryFn: (page) => getUsers({ ...payload, ...page }),
			meta: {
				apiErrorToastMessage: true,
			},
		},
		itemsKey: 'users',
		offset: paginationData.current,
		count: paginationData.itemsPerPage,
	});
	return { usersListQueryResult, paginationData };
};
export default useFilteredUsers;
