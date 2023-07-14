import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const OutlookEventsRoute = lazy(() => import('../../views/outlookCalendar/OutlookEventsRoute'));

export const useOutlookCalenderRoomAction = () => {
	const enabled = useSetting('Outlook_Calendar_Enabled', false);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return ui.addRoomAction('outlookCalendar', {
			groups: ['channel', 'group', 'team'],
			id: 'outlookCalendar',
			icon: 'calendar',
			title: 'Outlook_calendar',
			template: OutlookEventsRoute,
			order: 999,
		});
	}, [enabled]);
};
