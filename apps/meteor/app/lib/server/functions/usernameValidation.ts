import { settings } from '../../../settings/server';

export const usernameValidation = function (username: string): boolean {
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (nameValidation.test(username)) {
		return true;
	}
	return false;
};
