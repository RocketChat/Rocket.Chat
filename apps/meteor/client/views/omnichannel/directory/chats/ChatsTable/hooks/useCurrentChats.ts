import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';

type CurrentChatsResult = OperationResult<'GET', '/v1/livechat/rooms'>;

export const useCurrentChats = (query: GETLivechatRoomsParams) => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	return usePaginatedQuery<GETLivechatRoomsParams, CurrentChatsResult>({
		query,
		getQueryKey: (query) => ['current-chats', query],
		queryFn: (query) => currentChats(query) as unknown as Promise<CurrentChatsResult>,
		itemsKey: 'rooms',

		// TODO: Update this to use an stream of room changes instead of polling
		refetchOnWindowFocus: false,

		gcTime: 0,
	});
};
