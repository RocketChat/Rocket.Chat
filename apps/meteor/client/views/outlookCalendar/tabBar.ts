import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { ui } from '../../lib/ui';

ui.addRoomAction('outlookCalendar', () => {
	const outlookCalendarEnabled = useSetting('Outlook_Calendar_Enabled');

	return useMemo(
		() =>
			outlookCalendarEnabled
				? {
						groups: ['channel', 'group', 'team'],
						id: 'outlookCalendar',
						icon: 'calendar',
						title: 'Outlook_calendar',
						template: lazy(() => import('./OutlookEventsRoute')),
						order: 999,
				  }
				: null,
		[outlookCalendarEnabled],
	);
});
