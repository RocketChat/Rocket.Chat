import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useCurrentContacts = (
	query: GETLivechatRoomsParams,
): UseQueryResult<OperationResult<'GET', '/v1/livechat/visitors.search'>> => {
	const currentContacts = useEndpoint('GET', '/v1/livechat/visitors.search');

	return useQuery(['current-contacts', query], () => currentContacts(query));
};
