import { settings } from '../../../settings/server';
import { SettingComposedValue } from '../../../settings/lib/settings';

export const validateName = function(name: string): boolean {
	const settingValues = settings.get('Accounts_SystemBlockedUsernameList') as SettingComposedValue[];
	const reservedNames = settingValues.map((setting: SettingComposedValue) => setting.toString());

	if (reservedNames.includes(name.toLowerCase())) {
		return false;
	}

	return true;
};
