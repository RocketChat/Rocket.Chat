import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('push-notifications', {
	groups: ['channel', 'group', 'direct', 'live'],
	id: 'push-notifications',
	title: 'Notifications_Preferences',
	icon: 'bell',
	template: lazy(() => import('../../../client/views/room/contextualBar/NotificationPreferences')),
	order: 8,
});
