import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import OAuthAppsPage from './OAuthAppsPage';

const OAuthAppsRoute = (): ReactElement => {
	const canAccessOAuthApps = usePermission('manage-oauth-apps');

	if (!canAccessOAuthApps) {
		return <NotAuthorizedPage />;
	}

	return <OAuthAppsPage />;
};

export default OAuthAppsRoute;
