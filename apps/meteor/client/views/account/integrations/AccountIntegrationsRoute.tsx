import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AccountIntegrationsPage from './AccountIntegrationsPage';

const AccountIntegrationsRoute = (): ReactElement => {
	const webdavEnabled = useSetting('Webdav_Integration_Enabled');

	if (!webdavEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountIntegrationsPage />;
};

export default AccountIntegrationsRoute;
