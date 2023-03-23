import { Users } from '../../models';
import { settings } from '../../settings';

/**
 * @summary Get a user preference
 * @param {String} userId The user ID
 * @param {String} preference The preference name
 * @param {unknown?} defaultValue The default value
 * @returns {unknown} The preference value
 */
export const getUserPreference = (user, key, defaultValue = undefined) => {
	let preference;
	if (typeof user === typeof '') {
		user = Users.findOne(user, { fields: { [`settings.preferences.${key}`]: 1 } });
	}
	if (user?.settings?.preferences?.hasOwnProperty(key) && user.settings.preferences[key] !== 'default') {
		preference = user.settings.preferences[key];
	} else if (defaultValue === undefined) {
		preference = settings.get(`Accounts_Default_User_Preferences_${key}`);
	}

	return preference !== undefined ? preference : defaultValue;
};
