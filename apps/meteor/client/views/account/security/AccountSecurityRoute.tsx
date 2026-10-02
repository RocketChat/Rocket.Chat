import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';

import AccountSecurityPage from './AccountSecurityPage';

const AccountSecurityRoute = () => {
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
