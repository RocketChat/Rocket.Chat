import { settings } from '../../../settings/server';

export const validateUsername = (username: string): boolean => {
	const settingsRegExp = settings.get('UTF8_User_Names_Validation');

	const usernameRegExp = settingsRegExp ? new RegExp(`^${settingsRegExp}$`) : new RegExp('^[0-9a-zA-Z-_.]+$');

	return usernameRegExp.test(username);
};
