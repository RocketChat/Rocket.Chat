import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import CloudPage from './CloudPage';

function CloudRoute({ page = 'configuration' }) {
	const canManageCloud = usePermission('manage-cloud');

	if (!canManageCloud) {
		return <NotAuthorizedPage />;
	}

	if (page === 'configuration') {
		return <CloudPage />;
	}

	return null;
}

export default CloudRoute;
