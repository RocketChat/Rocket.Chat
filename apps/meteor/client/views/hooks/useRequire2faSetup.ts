import { useSetting, useUser } from '@rocket.chat/ui-contexts';

import { useRoles } from './useRoles';

export const useRequire2faSetup = () => {
	const user = useUser();
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const roles = useRoles({ roles: user?.roles || [] });

	// User is already using 2fa
	if (!user || user?.services?.totp?.enabled || user?.services?.email2fa?.enabled) {
		return false;
	}

	const mandatoryRole = roles.data?.some((role) => role.mandatory2fa);
	return !!tfaEnabled && mandatoryRole !== undefined;
};
