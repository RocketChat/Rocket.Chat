import { Settings } from '@rocket.chat/models';

export const validateName = async function (name: string): Promise<boolean> {
	const setting = await Settings.findOneById('Accounts_SystemBlockedUsernameList');
	if (!setting) {
		return true;
	}

	const blockedNames = setting.value;
	if (!blockedNames || typeof blockedNames !== 'string') {
		return true;
	}

	if (blockedNames.split(',').includes(name.toLowerCase())) {
		return false;
	}

	return true;
};
