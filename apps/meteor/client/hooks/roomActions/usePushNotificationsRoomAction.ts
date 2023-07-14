import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';
import { useRoomSubscription } from '../../views/room/contexts/RoomContext';

const NotificationPreferences = lazy(() => import('../../views/room/contextualBar/NotificationPreferences'));

export const usePushNotificationsRoomAction = () => {
	const subscription = useRoomSubscription();
	const capable = !!subscription;

	useEffect(() => {
		if (!capable) {
			return;
		}

		return ui.addRoomAction('push-notifications', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'push-notifications',
			title: 'Notifications_Preferences',
			icon: 'bell',
			template: NotificationPreferences,
			order: 8,
		});
	}, [capable]);
};
