import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AccountIntegrationsPage from './AccountIntegrationsPage';

const AccountIntegrationsRoute = (): ReactElement => {
	const webdavEnabled = useSetting<boolean>('Webdav_Integration_Enabled', false);

	if (!webdavEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountIntegrationsPage />;
};

export default AccountIntegrationsRoute;
