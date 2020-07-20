import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import OAuthAppsPage from './OAuthAppsPage';

export default function MailerRoute() {
	const canAccessOAuthApps = usePermission('manage-oauth-apps');

	if (!canAccessOAuthApps) {
		return <NotAuthorizedPage/>;
	}

	return <OAuthAppsPage />;
}
