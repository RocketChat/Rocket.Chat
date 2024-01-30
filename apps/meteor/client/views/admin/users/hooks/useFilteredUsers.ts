import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';
import type { IAdminUserTabs } from '../IAdminUserTabs';

type useFilteredUsersOptions = {
	searchTerm: string;
	prevSearchTerm: MutableRefObject<string>;
	tab: IAdminUserTabs;
	selectedRoles: string[];
	paginationData: ReturnType<typeof usePagination>;
	sortData: ReturnType<typeof useSort<'name' | 'username' | 'emails.address' | 'status'>>;
};

const useFilteredUsers = ({ searchTerm, prevSearchTerm, sortData, tab, selectedRoles, paginationData }: useFilteredUsersOptions) => {
	const { setCurrent, itemsPerPage, current } = paginationData;
	const { sortBy, sortDirection } = sortData;

	const payload = useMemo(() => {
		if (searchTerm !== prevSearchTerm.current) {
			setCurrent(0);
		}

		return {
			status: tab,
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
