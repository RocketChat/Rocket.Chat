import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const useCurrentChatsStreamUpdates = (): void => {
	const queryClient = useQueryClient();
	const userId = useUserId();
	const subscribeToNotifyLogged = useStream('notify-logged');
	const subscribeToInquiryQueue = useStream('livechat-inquiry-queue-observer');

	useEffect(() => {
		if (!userId) {
			return;
		}

		const unsubscribePriority = subscribeToNotifyLogged('omnichannel.priority-changed', () => {
			queryClient.invalidateQueries({ queryKey: ['current-chats'] });
		});

		const unsubscribeInquiry = subscribeToInquiryQueue('public', () => {
			queryClient.invalidateQueries({ queryKey: ['current-chats'] });
		});

		return () => {
			unsubscribePriority();
			unsubscribeInquiry();
		};
	}, [userId, subscribeToNotifyLogged, subscribeToInquiryQueue, queryClient]);
};

export const useCurrentChats = (query: GETLivechatRoomsParams): UseQueryResult<OperationResult<'GET', '/v1/livechat/rooms'>> => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	const debouncedQuery = useDebouncedValue(query, 500);

	useCurrentChatsStreamUpdates();

	return useQuery({
		queryKey: ['current-chats', debouncedQuery],
		queryFn: () => currentChats(debouncedQuery),
		refetchOnWindowFocus: false,
		gcTime: 0,
	});
};

