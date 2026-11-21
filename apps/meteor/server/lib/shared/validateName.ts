import { settings } from '../../settings';

const URL_DOT_SEGMENTS = ['.', '..'];

export const validateName = function (name: string): boolean {
	if (URL_DOT_SEGMENTS.includes(name)) {
		return false;
	}

	const blockedNames = settings.get('Accounts_SystemBlockedUsernameList');
	if (!blockedNames || typeof blockedNames !== 'string') {
		return true;
	}

	if (blockedNames.split(',').includes(name.toLowerCase())) {
		return false;
	}

	return true;
};
