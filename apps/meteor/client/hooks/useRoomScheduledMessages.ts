import type { IRoom } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import { useExperimentalEndpoint } from './useExperimentalEndpoint';
import { MAX_ITEMS_PER_USER } from '../../lib/scheduledMessageLimits';
import { scheduledMessagesQueryKeys } from '../lib/queryKeys';

export const useRoomScheduledMessages = (rid: IRoom['_id'], enabled: boolean) => {
	const listScheduledMessages = useExperimentalEndpoint('GET', '/experimental/scheduledMessages.list');

	return useQuery({
		queryKey: scheduledMessagesQueryKeys.all,
		queryFn: async () => (await listScheduledMessages({ count: MAX_ITEMS_PER_USER })).scheduledMessages,
		select: (items) => items.filter((item) => item.rid === rid),
		enabled,
	});
};
