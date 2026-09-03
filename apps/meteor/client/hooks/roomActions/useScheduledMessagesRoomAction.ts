import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const ScheduledMessagesTab = lazy(() => import('../../views/room/contextualBar/ScheduledMessages/ScheduledMessagesTab'));

export const useScheduledMessagesRoomAction = () => {
	const enabled = useSetting('Message_AllowScheduling', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'scheduled-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Scheduled_messages',
			icon: 'clock',
			tabComponent: ScheduledMessagesTab,
			order: 10,
			type: 'organization',
		};
	}, [enabled]);
};
