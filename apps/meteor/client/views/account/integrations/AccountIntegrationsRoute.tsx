import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import AccountIntegrationsPage from './AccountIntegrationsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountIntegrationsRoute = (): ReactElement => {
	const webdavEnabled = useSetting('Webdav_Integration_Enabled', false);

	if (!webdavEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountIntegrationsPage />;
};

export default AccountIntegrationsRoute;
