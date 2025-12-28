import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import AccountSecurityPage from './AccountSecurityPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountSecurityRoute = (): ReactElement => {
	const isTwoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const isE2EEnabled = useSetting('E2E_Enable');
	const allowPasswordChange = useSetting('Accounts_AllowPasswordChange');

	const canViewSecurity = isTwoFactorEnabled || isE2EEnabled || allowPasswordChange;

	if (!canViewSecurity) {
		return <NotAuthorizedPage />;
	}

	return <AccountSecurityPage />;
};

export default AccountSecurityRoute;
