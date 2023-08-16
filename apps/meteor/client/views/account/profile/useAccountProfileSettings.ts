import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAccountProfileSettings = () => {
	const erasureType = useSetting('Message_ErasureType');
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const canChangeUsername = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');

	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const allowDeleteOwnAccount = useSetting('Accounts_AllowDeleteOwnAccount');
	const requireName = useSetting('Accounts_RequireNameForSignUp');
	const namesRegexSetting = useSetting('UTF8_User_Names_Validation');

	const namesRegex = useMemo(() => new RegExp(`^${namesRegexSetting}$`), [namesRegexSetting]);

	const settings = useMemo(
		() => ({
			allowRealNameChange,
			allowUserStatusMessageChange,
			allowEmailChange,
			allowUserAvatarChange,
			allowDeleteOwnAccount,
			canChangeUsername,
			requireName,
			namesRegex,
			erasureType,
		}),
		[
			erasureType,
			allowDeleteOwnAccount,
			allowEmailChange,
			allowRealNameChange,
			allowUserAvatarChange,
			allowUserStatusMessageChange,
			canChangeUsername,
			requireName,
			namesRegex,
		],
	);

	return settings;
};
