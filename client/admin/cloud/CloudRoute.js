import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import CloudPage from './CloudPage';

function CloudRoute() {
	const canManageCloud = usePermission('manage-cloud');

	if (!canManageCloud) {
		return <NotAuthorizedPage />;
	}

	return <CloudPage />;
}

export default CloudRoute;
