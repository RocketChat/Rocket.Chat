import { useSetting, useUser } from '@rocket.chat/ui-contexts';

import { Roles } from '../../../app/models/client';

export const useRequire2faSetup = () => {
	const user = useUser();
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled', false);

	return Roles.use((state) => {
		// User is already using 2fa
		if (!user || user?.services?.totp?.enabled || user?.services?.email2fa?.enabled) {
			return false;
		}

		const mandatoryRole = state.find((role) => !!role.mandatory2fa && user.roles?.includes(role._id));
		return mandatoryRole !== undefined && tfaEnabled;
	});
};
