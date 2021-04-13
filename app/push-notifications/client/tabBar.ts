import { lazy, useMemo } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useUserSubscription } from '../../../client/contexts/UserContext';

const query = {};

addAction('push-notifications', ({ room }) => {
	const hasSubscription = !!useUserSubscription(room._id, query);

	return useMemo(() => (hasSubscription ? {
		groups: ['channel', 'group', 'direct', 'live', 'team'],
		id: 'push-notifications',
		title: 'Notifications_Preferences',
		icon: 'bell',
		template: lazy(() => import('../../../client/views/room/contextualBar/NotificationPreferences')),
		order: 8,
	} : null), [hasSubscription]);
});
