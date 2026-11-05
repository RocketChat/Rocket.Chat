import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import { useCanScheduleMessages } from '../useCanScheduleMessages';

const ScheduledMessagesTab = lazy(() => import('../../views/room/contextualBar/ScheduledMessagesTab'));

export const useScheduledMessagesRoomAction = () => {
	const { _id: rid } = useRoom();
	const canSchedule = useCanScheduleMessages(rid);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!canSchedule) {
			return undefined;
		}

		return {
			id: 'scheduled-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Scheduled_messages',
			icon: 'clock-send',
			tabComponent: ScheduledMessagesTab,
			order: 11,
			type: 'organization',
		};
	}, [canSchedule]);
};
