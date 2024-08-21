import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAccountProfileSettings = () => {
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const canChangeUsername = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');

	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const requireName = useSetting<boolean>('Accounts_RequireNameForSignUp');

	const nameValidationReg = '^[0-9a-zA-Z-_.]+(?:@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+)?$';
	const namesRegex = useMemo(() => new RegExp(nameValidationReg), []);

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
