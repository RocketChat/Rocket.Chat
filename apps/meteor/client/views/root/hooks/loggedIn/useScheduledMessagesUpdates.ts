import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useCanScheduleMessages } from '../../../../hooks/useCanScheduleMessages';
import { scheduledMessagesQueryKeys } from '../../../../lib/queryKeys';

export const useScheduledMessagesUpdates = () => {
	const uid = useUserId();
	const enabled = useCanScheduleMessages();
	const queryClient = useQueryClient();
	const subscribeToNotifyUser = useStream('notify-user');

	useEffect(() => {
		if (!uid || !enabled) {
			return;
		}
		return subscribeToNotifyUser(`${uid}/scheduled-messages`, () => {
			void queryClient.invalidateQueries({ queryKey: scheduledMessagesQueryKeys.all });
		});
	}, [uid, enabled, subscribeToNotifyUser, queryClient]);
};
