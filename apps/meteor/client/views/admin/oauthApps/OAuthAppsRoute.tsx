import React, { ReactElement } from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
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
