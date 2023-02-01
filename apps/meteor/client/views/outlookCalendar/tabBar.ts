import { useTranslation } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { addAction } from '../room/lib/Toolbox';

addAction('outlookCalendar', ({ room }) => {
	const t = useTranslation();

	return useMemo(
		() => ({
			groups: ['channel', 'group', 'team'],
			id: 'outlookCalendar',
			icon: 'calendar',
			title: 'Outlook calendar',
			template: lazy(() => import('./OutlookEventsRoute')),
			order: 999,
		}),
		[],
	);
});
