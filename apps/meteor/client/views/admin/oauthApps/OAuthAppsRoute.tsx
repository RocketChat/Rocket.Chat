import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import OAuthAppsPage from './OAuthAppsPage';

const OAuthAppsRoute = () => {
	const canAccessOAuthApps = usePermission('manage-oauth-apps');

	if (!canAccessOAuthApps) {
		return <NotAuthorizedPage />;
	}

	return <OAuthAppsPage />;
};

export default OAuthAppsRoute;
