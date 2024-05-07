import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AccountProfilePage from './AccountProfilePage';

const AccountProfileRoute = (): ReactElement => {
	const canViewProfile = useSetting('Accounts_AllowUserProfileChange');

	if (!canViewProfile) {
		return <NotAuthorizedPage />;
	}

	return <AccountProfilePage />;
};

export default AccountProfileRoute;
