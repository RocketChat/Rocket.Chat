import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { Roles } from '../../../app/models/client';
import { useReactiveValue } from '../../hooks/useReactiveValue';

export const useRequire2faSetup = () => {
	const user = useUser();
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');

	return useReactiveValue(
		useCallback(() => {
			// User is already using 2fa
			if (!user || user?.services?.totp?.enabled || user?.services?.email2fa?.enabled) {
				return false;
			}

			const mandatoryRole = Roles.findOne({ _id: { $in: user.roles ?? [] }, mandatory2fa: true });
			return !!(mandatoryRole !== undefined && tfaEnabled);
		}, [tfaEnabled, user]),
	);
};
