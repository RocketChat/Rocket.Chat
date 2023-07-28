import { lazy, useMemo } from 'react';

import { useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const NotificationPreferences = lazy(() => import('../../views/room/contextualBar/NotificationPreferences'));

export const usePushNotificationsRoomAction = (): ToolboxActionConfig | undefined => {
	const subscription = useRoomSubscription();
	const capable = !!subscription;

	return useMemo(() => {
		if (!capable) {
			return undefined;
		}

		return {
			id: 'push-notifications',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Notifications_Preferences',
			icon: 'bell',
			template: NotificationPreferences,
			order: 8,
		};
	}, [capable]);
};
