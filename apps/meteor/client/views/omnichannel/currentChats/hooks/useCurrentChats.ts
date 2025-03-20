import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useCurrentChats = (query: GETLivechatRoomsParams): UseQueryResult<OperationResult<'GET', '/v1/livechat/rooms'>> => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	const debouncedQuery = useDebouncedValue(query, 500);

	return useQuery({
		queryKey: ['current-chats', debouncedQuery],
		queryFn: () => currentChats(debouncedQuery),

		// TODO: Update this to use an stream of room changes instead of polling
		refetchOnWindowFocus: false,

		gcTime: 0,
	});
};
