import { useUser } from '@rocket.chat/ui-contexts';

import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const OutlookEventsRoute = lazy(() => import('../../views/outlookCalendar/OutlookEventsRoute'));

export const useOutlookCalenderRoomAction = () => {
	const user = useUser();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!user?.settings?.calendar?.outlook?.Enabled) {
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
	}, [user?.settings?.calendar?.outlook?.Enabled]);
};
