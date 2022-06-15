import { Users } from '../../models';
import { settings } from '../../settings';

export const getUserPreference = (user, key, defaultValue = undefined) => {
	let preference;
	if (typeof user === typeof '') {
		user = Users.findOne(user, { fields: { [`settings.preferences.${key}`]: 1 } });
	}
	if (user && user.settings && user.settings.preferences && user.settings.preferences.hasOwnProperty(key)) {
		preference = user.settings.preferences[key];
	} else if (defaultValue === undefined) {
		preference = settings.get(`Accounts_Default_User_Preferences_${key}`);
	}

	return preference !== undefined ? preference : defaultValue;
};
