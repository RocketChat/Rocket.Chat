import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import CloudPage from './CloudPage';
import OAuthCallbackPage from './OAuthCallbackPage';

function CloudRoute({ page = 'configuration' }) {
	const canManageCloud = usePermission('manage-cloud');

	if (!canManageCloud) {
		return <NotAuthorizedPage />;
	}

	if (page === 'configuration') {
		return <CloudPage />;
	}

	if (page === 'oauth-callback') {
		return <OAuthCallbackPage />;
	}

	return null;
}

export default CloudRoute;
