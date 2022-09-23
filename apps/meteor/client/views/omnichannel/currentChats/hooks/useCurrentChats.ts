import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

export const useCurrentChats = (query: GETLivechatRoomsParams): UseQueryResult<OperationResult<'GET', '/v1/livechat/rooms'>> => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	return useQuery(['current-chats', query], () => currentChats(query));
};

export const useClientQueryInvalidateCurrentChats = (): (() => void) => {
	const queryClient = useQueryClient();

	return () => queryClient.invalidateQueries(['current-chats']);
};
