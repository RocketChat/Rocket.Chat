import type { IUser } from '@rocket.chat/core-typings';

import { getUserPreference } from './lib/getUserPreference';

export const getUserNotificationsSoundVolume = (userId: IUser['_id'] | null | undefined) => {
	const masterVolume = getUserPreference<number>(userId, 'masterVolume', 100);
	const notificationsSoundVolume = getUserPreference<number>(userId, 'notificationsSoundVolume', 100);

	return (notificationsSoundVolume * masterVolume) / 100;
};
