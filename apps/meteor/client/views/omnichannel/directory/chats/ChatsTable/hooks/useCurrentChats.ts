import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useCurrentChats = (query: GETLivechatRoomsParams): UseQueryResult<OperationResult<'GET', '/v1/livechat/rooms'>> => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	return useQuery({
		queryKey: ['current-chats', query],
		queryFn: () => currentChats(query),

		// TODO: Update this to use an stream of room changes instead of polling
		refetchOnWindowFocus: false,

		gcTime: 0,
	});
};
