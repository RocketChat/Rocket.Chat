import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';

export const useListAllUsers = (
	searchTerm: string,
	prevSearchTerm: MutableRefObject<string>,
	setCurrent: ReturnType<typeof usePagination>['setCurrent'],
	sortBy: ReturnType<typeof useSort>['sortBy'],
	sortDirection: ReturnType<typeof useSort>['sortDirection'],
	itemsPerPage: ReturnType<typeof usePagination>['itemsPerPage'],
	current: ReturnType<typeof usePagination>['current'],
	setPendingActionsCount: React.Dispatch<React.SetStateAction<number>>,
) => {
	const query = useDebouncedValue(
		useMemo(() => {
			if (searchTerm !== prevSearchTerm.current) {
				setCurrent(0);
			}

			return {
				fields: JSON.stringify({
					name: 1,
					username: 1,
					emails: 1,
					roles: 1,
					status: 1,
					avatarETag: 1,
					active: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: escapeRegExp(searchTerm), $options: 'i' } },
						{ username: { $regex: escapeRegExp(searchTerm), $options: 'i' } },
						{ name: { $regex: escapeRegExp(searchTerm), $options: 'i' } },
					],
				}),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: searchTerm === prevSearchTerm.current ? current : 0,
			};
		}, [searchTerm, prevSearchTerm, sortBy, sortDirection, itemsPerPage, current, setCurrent]),
		500,
	);

	const getUsers = useEndpoint('GET', '/v1/users.list');

	const dispatchToastMessage = useToastMessageDispatch();

	const usersListQueryResult = useQuery(['allUsers', query], async () => getUsers(query), {
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	if (usersListQueryResult.isSuccess) {
		setPendingActionsCount(usersListQueryResult.data.users.filter((user) => !user.active).length);
	}

	return usersListQueryResult;
};
