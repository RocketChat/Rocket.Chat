import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';

const useListTabUsers = (
	searchTerm: string,
	prevSearchTerm: MutableRefObject<string>,
	setCurrent: ReturnType<typeof usePagination>['setCurrent'],
	sortBy: ReturnType<typeof useSort>['sortBy'],
	sortDirection: ReturnType<typeof useSort>['sortDirection'],
	itemsPerPage: ReturnType<typeof usePagination>['itemsPerPage'],
	current: ReturnType<typeof usePagination>['current'],
	tab: string,
) => {
	const payload = useDebouncedValue(
		useMemo(() => {
			if (searchTerm !== prevSearchTerm.current) {
				setCurrent(0);
			}

			return {
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: searchTerm === prevSearchTerm.current ? current : 0,
			};
		}, [current, itemsPerPage, prevSearchTerm, searchTerm, setCurrent, sortBy, sortDirection]),
		500,
	);

	const getUsers = useEndpoint('GET', '/v1/users.list/:status', { status: tab });

	const dispatchToastMessage = useToastMessageDispatch();

	const usersListQueryResult = useQuery(['tabUsers', payload, tab], async () => getUsers(payload), {
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return usersListQueryResult;
};

export default useListTabUsers;
