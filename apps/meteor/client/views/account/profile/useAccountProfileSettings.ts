import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAccountProfileSettings = () => {
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const canChangeUsername = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');

	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const requireName = useSetting<boolean>('Accounts_RequireNameForSignUp');
	const namesRegexSetting = useSetting('UTF8_User_Names_Validation');

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
