import { lazy, useMemo } from 'react';

import { useUserSubscription } from '../../../client/contexts/UserContext';
import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('push-notifications', ({ room }) => {
	if (!room) {
		return null;
	}

	const subscription = useUserSubscription(room._id);
	if (!subscription) {
		return null;
	}

	return useMemo(() => ({
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		id: 'push-notifications',
		title: 'Notifications_Preferences',
		icon: 'bell',
		template: lazy(() => import('../../../client/views/room/contextualBar/NotificationPreferences')),
		order: 8,
	}), []);
});
