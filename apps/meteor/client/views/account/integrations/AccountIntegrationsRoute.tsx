import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';

import AccountIntegrationsPage from './AccountIntegrationsPage';

const AccountIntegrationsRoute = () => {
	const webdavEnabled = useSetting('Webdav_Integration_Enabled', false);

	if (!webdavEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountIntegrationsPage />;
};

export default AccountIntegrationsRoute;
