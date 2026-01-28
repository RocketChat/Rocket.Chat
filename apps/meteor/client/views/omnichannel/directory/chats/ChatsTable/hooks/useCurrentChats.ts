import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { GETLivechatRoomsParams, OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';

import { sdk } from '../../../../../../app/utils/client/lib/SDKClient';

/**
 * Subscribes to Omnichannel room change streams to enable real-time updates.
 * This replaces the polling mechanism with event-driven cache invalidation.
 *
 * Listens to:
 * - notify-logged: omnichannel.priority-changed (priority updates)
 * - livechat-inquiry-queue-observer: public (inquiry status changes)
 */
const useCurrentChatsStreamUpdates = (): void => {
	const queryClient = useQueryClient();
	const userId = useUserId();
	const subscribeToNotifyLogged = useStream('notify-logged');

	const invalidateCurrentChats = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['current-chats'] });
	}, [queryClient]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		// Subscribe to priority changes via notify-logged stream
		const unsubscribePriority = subscribeToNotifyLogged('omnichannel.priority-changed', () => {
			invalidateCurrentChats();
		});

		// Subscribe to inquiry queue changes (added/removed/changed inquiries)
		sdk.stream('livechat-inquiry-queue-observer', ['public'], () => {
			invalidateCurrentChats();
		});

		return () => {
			unsubscribePriority();
			sdk.stop('livechat-inquiry-queue-observer', 'public');
		};
	}, [userId, subscribeToNotifyLogged, invalidateCurrentChats]);
};

export const useCurrentChats = (query: GETLivechatRoomsParams): UseQueryResult<OperationResult<'GET', '/v1/livechat/rooms'>> => {
	const currentChats = useEndpoint('GET', '/v1/livechat/rooms');

	const debouncedQuery = useDebouncedValue(query, 500);

	// Enable real-time updates via stream subscriptions
	useCurrentChatsStreamUpdates();

	return useQuery({
		queryKey: ['current-chats', debouncedQuery],
		queryFn: () => currentChats(debouncedQuery),
		// Stream subscriptions now handle real-time updates, reducing need for refetch on focus
		refetchOnWindowFocus: false,
		gcTime: 0,
	});
};
