import { settings } from '../../../settings/server';

export const validateName = function (name: string): boolean {
	const blockedNames = settings.get('Accounts_SystemBlockedUsernameList');
	if (!blockedNames || typeof blockedNames !== 'string') {
		return true;
	}

	if (blockedNames.split(',').includes(name.toLowerCase())) {
		return false;
	}

	return true;
};
