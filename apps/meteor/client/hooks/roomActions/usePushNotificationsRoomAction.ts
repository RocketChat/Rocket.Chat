import { lazy, useMemo } from 'react';

import { useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const NotificationPreferences = lazy(() => import('../../views/room/contextualBar/NotificationPreferences'));

export const usePushNotificationsRoomAction = () => {
	const subscription = useRoomSubscription();
	const capable = !!subscription;

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!capable) {
			return undefined;
		}

		return {
			id: 'push-notifications',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Notifications_Preferences',
			icon: 'bell',
			tabComponent: NotificationPreferences,
			order: 11,
			type: 'customization',
		};
	}, [capable]);
};
