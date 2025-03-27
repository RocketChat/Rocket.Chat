import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import { notificationManager } from '../../lib/notificationManager';

export const useNotificationPermission = () => {
	const requestPermission = useEffectEvent(async () => {
		const response = await Notification.requestPermission();
		notificationManager.allowed = response === 'granted';
		notificationManager.emit('change');

		const notifications = await navigator.permissions.query({ name: 'notifications' });
		notifications.onchange = () => {
			notificationManager.allowed = notifications.state === 'granted';
			notificationManager.emit('change');
		};
	});

	if ('Notification' in window) {
		requestPermission();
	}
};
