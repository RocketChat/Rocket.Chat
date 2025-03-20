import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const OutlookEventsRoute = lazy(() => import('../../views/outlookCalendar/OutlookEventsRoute'));

export const useOutlookCalenderRoomAction = () => {
	const enabled = useSetting('Outlook_Calendar_Enabled', false);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'outlookCalendar',
			groups: ['channel', 'group', 'team'],
			icon: 'calendar',
			title: 'Outlook_calendar',
			tabComponent: OutlookEventsRoute,
			order: 999,
		};
	}, [enabled]);
};
