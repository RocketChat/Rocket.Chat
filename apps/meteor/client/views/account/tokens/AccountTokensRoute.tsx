import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AccountTokensPage from './AccountTokensPage';

const AccountTokensRoute = (): ReactElement => {
	const canCreateTokens = usePermission('create-personal-access-tokens');

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <AccountTokensPage />;
};

export default AccountTokensRoute;
