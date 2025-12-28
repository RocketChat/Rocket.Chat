import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import OAuthAppsPage from './OAuthAppsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const OAuthAppsRoute = (): ReactElement => {
	const canAccessOAuthApps = usePermission('manage-oauth-apps');

	if (!canAccessOAuthApps) {
		return <NotAuthorizedPage />;
	}

	return <OAuthAppsPage />;
};

export default OAuthAppsRoute;
