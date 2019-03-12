import { settings } from '/app/settings';
import { Users } from '/app/models';

export const getUserNotificationPreference = (user, pref) => {
	if (typeof user === 'string') {
		user = Users.findOneById(user);
	}

	let preferenceKey;
	switch (pref) {
		case 'desktop': preferenceKey = 'desktopNotifications'; break;
		case 'mobile': preferenceKey = 'mobileNotifications'; break;
		case 'email': preferenceKey = 'emailNotificationMode'; break;
	}

	if (user && user.settings && user.settings.preferences && user.settings.preferences[preferenceKey] !== 'default') {
		return {
			value: user.settings.preferences[preferenceKey],
			origin: 'user',
		};
	}
	const serverValue = settings.get(`Accounts_Default_User_Preferences_${ preferenceKey }`);
	if (serverValue) {
		return {
			value: serverValue,
			origin: 'server',
		};
	}

	return null;
};
