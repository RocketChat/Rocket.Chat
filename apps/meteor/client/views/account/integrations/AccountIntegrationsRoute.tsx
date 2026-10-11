import { useSetting } from '@rocket.chat/ui-contexts';

import AccountIntegrationsPage from './AccountIntegrationsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountIntegrationsRoute = () => {
	const webdavEnabled = useSetting('Webdav_Integration_Enabled', false);

	if (!webdavEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountIntegrationsPage />;
};

export default AccountIntegrationsRoute;
