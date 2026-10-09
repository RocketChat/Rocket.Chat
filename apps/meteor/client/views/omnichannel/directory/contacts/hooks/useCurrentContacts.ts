import type { OperationResult, PaginatedRequest } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useCurrentContacts = (
	query: PaginatedRequest<{
		searchText: string;
	}>,
	queryKey: readonly unknown[],
): UseQueryResult<OperationResult<'GET', '/v1/omnichannel/contacts.search'>> => {
	const currentContacts = useEndpoint('GET', '/v1/omnichannel/contacts.search');

	return useQuery({
		queryKey,
		queryFn: async () => {
			const result = await currentContacts(query);
			return { ...result, offset: query.offset ?? 0, count: result.contacts.length };
		},
	});
};
