import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../settings/server';

export const getUserNotificationPreference = async (user: IUser | string, pref: string) => {
	if (typeof user === 'string') {
		const u = await Users.findOneById(user);
		if (!u) {
			return null;
		}
		user = u;
	}

	let preferenceKey: 'desktopNotifications' | 'pushNotifications' | 'emailNotificationMode' | undefined;
	switch (pref) {
		case 'desktop':
			preferenceKey = 'desktopNotifications';
			break;
		case 'mobile':
			preferenceKey = 'pushNotifications';
			break;
		case 'email':
			preferenceKey = 'emailNotificationMode';
			break;
	}

	if (!preferenceKey) {
		return null;
	}

	if (
		user?.settings?.preferences &&
		typeof user.settings.preferences[preferenceKey] !== 'undefined' &&
		user.settings.preferences[preferenceKey] !== 'default'
	) {
		return {
			value: user.settings.preferences[preferenceKey],
			origin: 'user',
		};
	}
	const serverValue = settings.get(`Accounts_Default_User_Preferences_${preferenceKey}`);
	if (serverValue) {
		return {
			value: serverValue,
			origin: 'server',
		};
	}

	return null;
};
