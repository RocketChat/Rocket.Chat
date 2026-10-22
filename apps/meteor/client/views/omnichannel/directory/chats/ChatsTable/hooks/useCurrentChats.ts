import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';

type CurrentChatsResult = OperationResult<'GET', '/v1/livechat/rooms'>;

export const useCurrentChats = (query: GETLivechatRoomsParams, { offset, count }: { offset: number; count: number }) => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	return usePaginatedQuery<CurrentChatsResult>({
		query: {
			queryKey: ['current-chats', query],
			queryFn: (page) => currentChats({ ...query, ...page }) as unknown as Promise<CurrentChatsResult>,

			// TODO: Update this to use an stream of room changes instead of polling
			refetchOnWindowFocus: false,

			gcTime: 0,
		},
		itemsKey: 'rooms',
		offset,
		count,
	});
};
