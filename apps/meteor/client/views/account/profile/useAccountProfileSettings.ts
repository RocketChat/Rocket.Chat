import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAccountProfileSettings = () => {
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange', true);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);
	const canChangeUsername = useSetting('Accounts_AllowUsernameChange', true);
	const allowEmailChange = useSetting('Accounts_AllowEmailChange', true);

	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange', true);
	const requireName = useSetting('Accounts_RequireNameForSignUp', true);
	const namesRegexSetting = useSetting('UTF8_User_Names_Validation', '[0-9a-zA-Z-_.]+');

	const namesRegex = useMemo(() => new RegExp(`^${namesRegexSetting}$`), [namesRegexSetting]);

	return {
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowUserAvatarChange,
		canChangeUsername,
		requireName,
		namesRegex,
	};
};
