import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AccountSecurityPage from './AccountSecurityPage';

const AccountSecurityRoute = (): ReactElement => {
	const isTwoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const isE2EEnabled = useSetting('E2E_Enable');
	const canViewSecurity = isTwoFactorEnabled || isE2EEnabled;

	if (!canViewSecurity) {
		return <NotAuthorizedPage />;
	}

	return <AccountSecurityPage />;
};

export default AccountSecurityRoute;
