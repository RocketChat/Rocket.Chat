import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import { useCanScheduleMessages } from '../useCanScheduleMessages';
import { useMyScheduledMessages } from '../useScheduledMessages';

const ScheduledMessagesTab = lazy(() => import('../../views/room/contextualBar/ScheduledMessagesTab'));

export const useScheduledMessagesRoomAction = () => {
	const { _id: rid } = useRoom();
	const canSchedule = useCanScheduleMessages(rid);
	const { data: count } = useMyScheduledMessages({
		select: (items) => items.filter((item) => item.rid === rid).length,
		enabled: canSchedule,
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!canSchedule) {
			return undefined;
		}

		return {
			id: 'scheduled-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Scheduled_messages',
			count,
			icon: 'clock',
			tabComponent: ScheduledMessagesTab,
			order: 11,
			type: 'organization',
		};
	}, [canSchedule, count]);
};
