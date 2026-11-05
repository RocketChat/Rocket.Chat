import type { IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useExperimentalEndpoint } from './useExperimentalEndpoint';
import { MAX_ITEMS_PER_USER } from '../../lib/scheduledMessageLimits';
import { scheduledMessagesQueryKeys } from '../lib/queryKeys';

const useListQueryOptions = () => {
	const listScheduledMessages = useExperimentalEndpoint('GET', '/experimental/scheduledMessages.list');

	return {
		queryKey: scheduledMessagesQueryKeys.mine(),
		queryFn: async () => (await listScheduledMessages({ count: MAX_ITEMS_PER_USER })).scheduledMessages,
	};
};

export const useScheduledMessages = ({ enabled }: { enabled: boolean }) => {
	const uid = useUserId();
	const queryClient = useQueryClient();
	const subscribeToNotifyUser = useStream('notify-user');
	const options = useListQueryOptions();

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
