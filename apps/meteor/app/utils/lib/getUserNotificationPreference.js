import { Users } from '@rocket.chat/models';

import { settings } from '../../settings';

export const getUserNotificationPreference = async (user, pref) => {
	if (typeof user === 'string') {
		user = await Users.findOneById(user);
	}

	let preferenceKey;
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
