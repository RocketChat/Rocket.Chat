import { Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

/**
 * @summary Get a user preference
 * @param {String} userId The user ID
 * @param {String} preference The preference name
 * @param {unknown?} defaultValue The default value
 * @returns {unknown} The preference value
 */
export const getUserPreference = async (user, key, defaultValue = undefined) => {
	let preference;
	if (typeof user === typeof '') {
		user = await Users.findOneById(user, { projection: { [`settings.preferences.${key}`]: 1 } });
	}
	if (user && user.settings && user.settings.preferences && user.settings.preferences.hasOwnProperty(key)) {
		preference = user.settings.preferences[key];
	} else if (defaultValue === undefined) {
		preference = settings.get(`Accounts_Default_User_Preferences_${key}`);
	}

	return preference !== undefined ? preference : defaultValue;
};
