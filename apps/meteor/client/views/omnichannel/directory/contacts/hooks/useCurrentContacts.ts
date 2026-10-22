import type { OperationResult, PaginatedRequest } from '@rocket.chat/rest-typings';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';

type CurrentContactsQuery = PaginatedRequest<{
	searchText: string;
}>;

type CurrentContactsResult = OperationResult<'GET', '/v1/omnichannel/contacts.search'>;

export const useCurrentContacts = (query: CurrentContactsQuery, { offset, count }: { offset: number; count: number }) => {
	const currentContacts = useEndpoint('GET', '/v1/omnichannel/contacts.search');

	return usePaginatedQuery<CurrentContactsResult>({
		query: {
			queryKey: ['current-contacts', query],
			queryFn: (page) => currentContacts({ ...query, ...page }) as unknown as Promise<CurrentContactsResult>,
		},
		itemsKey: 'contacts',
		offset,
		count,
	});
};
