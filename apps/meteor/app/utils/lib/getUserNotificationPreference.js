import { settings } from '../../settings';
import { Users } from '../../models';

export const getUserNotificationPreference = (user, pref) => {
	if (typeof user === 'string') {
		user = Users.findOneById(user);
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
