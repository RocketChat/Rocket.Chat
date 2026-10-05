import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { UserAutoCompleteOptionType } from '../UsersSelectElement';

type useUsersDataProps = {
	filter: string;
	selected?: string[];
};

/** Options matching the filter, plus the selected users, so their chips render even when the search does not return them. */
export const useUsersData = ({ filter, selected = [] }: useUsersDataProps) => {
	const getUsers = useEndpoint('GET', '/v1/users.autocomplete');
	const getUserInfo = useEndpoint('GET', '/v1/users.info');

	const { data } = useQuery({
		queryKey: ['users.autoComplete', filter],

		queryFn: async () => {
			const users = await getUsers({
				selector: JSON.stringify({ term: filter }),
			});
			const options = users.items.map((item): UserAutoCompleteOptionType => ({
				value: item.username,
				label: item.name || item.username,
			}));

			return options || [];
		},

		placeholderData: keepPreviousData,
	});

	const missing = selected.filter((username) => !data?.some(({ value }) => value === username));

	const selectedOptions = useQueries({
		queries: missing.map((username) => ({
			queryKey: ['users.info', username],
			queryFn: async (): Promise<UserAutoCompleteOptionType> => {
				const { user } = await getUserInfo({ username });
				return { value: username, label: user.name || username };
			},
			staleTime: Infinity,
		})),
		combine: (results) => results.flatMap(({ data }) => (data ? [data] : [])),
	});

	return useMemo(() => (data ? [...data, ...selectedOptions] : selectedOptions), [data, selectedOptions]);
};
