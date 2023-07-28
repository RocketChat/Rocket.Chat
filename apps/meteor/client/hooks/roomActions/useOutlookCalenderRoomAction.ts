import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const OutlookEventsRoute = lazy(() => import('../../views/outlookCalendar/OutlookEventsRoute'));

export const useOutlookCalenderRoomAction = (): ToolboxActionConfig | undefined => {
	const enabled = useSetting('Outlook_Calendar_Enabled', false);

	return useMemo(() => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'outlookCalendar',
			groups: ['channel', 'group', 'team'],
			icon: 'calendar',
			title: 'Outlook_calendar',
			template: OutlookEventsRoute,
			order: 999,
		};
	}, [enabled]);
};
