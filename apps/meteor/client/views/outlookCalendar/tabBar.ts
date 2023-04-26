import { lazy } from 'react';

import { addAction } from '../room/lib/Toolbox';

addAction('outlookCalendar', {
	groups: ['channel', 'group', 'team'],
	id: 'outlookCalendar',
	icon: 'calendar',
	title: 'Outlook_calendar',
	template: lazy(() => import('./OutlookEventsRoute')),
	order: 999,
});
