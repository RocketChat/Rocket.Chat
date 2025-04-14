import { useCallback, useSyncExternalStore } from 'react';

import { notificationManager } from '../../lib/notificationManager';

export const useNotificationAllowed = (): boolean => {
	const allowed = useSyncExternalStore(
		useCallback(
			(callback): (() => void) =>
				notificationManager.on('change', () => {
					notificationManager.allowed = Notification.permission === 'granted';
					callback();
				}),
			[],
		),
		(): boolean => notificationManager.allowed,
	);

	return allowed;
};
