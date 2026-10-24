import type { IRoom, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { MAX_ITEMS_PER_USER } from '../../lib/scheduledMessageLimits';
import { scheduledMessagesQueryKeys } from '../lib/queryKeys';

const useListQueryOptions = (rid?: IRoom['_id']) => {
	const listScheduledMessages = useEndpoint('GET', '/v1/scheduledMessages.list');

	return {
		queryKey: rid ? scheduledMessagesQueryKeys.room(rid) : scheduledMessagesQueryKeys.mine(),
		queryFn: async () => (await listScheduledMessages({ ...(rid && { roomId: rid }), count: MAX_ITEMS_PER_USER })).scheduledMessages,
	};
};

export const useScheduledMessages = (rid?: IRoom['_id'], { enabled = true }: { enabled?: boolean } = {}) => {
	const uid = useUserId();
	const queryClient = useQueryClient();
	const subscribeToNotifyUser = useStream('notify-user');
	const options = useListQueryOptions(rid);

	const refresh = useStableCallback(() => {
		void queryClient.invalidateQueries({ queryKey: options.queryKey });
	});

	useEffect(() => {
		if (!uid || !enabled) {
			return;
		}
		return subscribeToNotifyUser(`${uid}/scheduled-messages`, refresh);
	}, [uid, enabled, subscribeToNotifyUser, refresh]);

	return useQuery({ ...options, enabled });
};

export const useMyScheduledMessages = <T>({
	select,
	enabled,
}: {
	select: (items: Serialized<IScheduledMessage>[]) => T;
	enabled: boolean;
}) => useQuery({ ...useListQueryOptions(), select, enabled });
