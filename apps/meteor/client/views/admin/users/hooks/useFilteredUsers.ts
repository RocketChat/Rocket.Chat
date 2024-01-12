import { useCallback, type MutableRefObject } from 'react';

import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useListAllUsers } from './useListAllUsers';
import useListTabUsers from './useListTabUsers';

const useFilteredUsers = (
	searchTerm: string,
	prevSearchTerm: MutableRefObject<string>,
	setCurrent: ReturnType<typeof usePagination>['setCurrent'],
	sortBy: ReturnType<typeof useSort>['sortBy'],
	sortDirection: ReturnType<typeof useSort>['sortDirection'],
	itemsPerPage: ReturnType<typeof usePagination>['itemsPerPage'],
	current: ReturnType<typeof usePagination>['current'],
	setPendingActionsCount: React.Dispatch<React.SetStateAction<number>>,
	tab: string,
) => {
	const {
		data: allUsersListData,
		isLoading: isAllUsersLoading,
		isSuccess: isAllusersSuccess,
		isError: isAllUsersError,
		refetch: refetchAllusers,
	} = useListAllUsers(searchTerm, prevSearchTerm, setCurrent, sortBy, sortDirection, itemsPerPage, current, setPendingActionsCount);

	const {
		data: tabUsersListData,
		isLoading: isTabUsersLoading,
		isSuccess: isTabUsersSuccess,
		isError: isTabUsersError,
		refetch: refetchTabUsers,
	} = useListTabUsers(searchTerm, prevSearchTerm, setCurrent, sortBy, sortDirection, itemsPerPage, current, tab);

	const useAllUsers = () => (tab === 'all' && isAllusersSuccess ? allUsersListData?.users : []);
	const useTabUsers = () => (tab !== 'all' && isTabUsersSuccess ? tabUsersListData?.users : []);

	const filteredUsers = [...useAllUsers(), ...useTabUsers()];
	const isSuccess = isAllusersSuccess && isTabUsersSuccess;
	const refetch = useCallback(() => {
		refetchAllusers();
		refetchTabUsers();
	}, [refetchAllusers, refetchTabUsers]);
	const isLoading = isAllUsersLoading && isTabUsersLoading;
	const isError = isAllUsersError && isTabUsersError;
	const paginationMetadata =
		tab === 'all'
			? { count: allUsersListData?.count, offset: allUsersListData?.offset, total: allUsersListData?.total }
			: { count: tabUsersListData?.count, offset: tabUsersListData?.offset, total: tabUsersListData?.total };

	return {
		filteredUsers,
		isSuccess,
		refetch,
		isLoading,
		isError,
		paginationMetadata,
	};
};

export default useFilteredUsers;
