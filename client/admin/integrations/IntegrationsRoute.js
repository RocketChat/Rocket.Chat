import React from 'react';

import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import IntegrationsPage from './IntegrationsPage';

function IntegrationsRoute() {
	const canViewIntegrationsPage = useAtLeastOnePermission([
		'manage-incoming-integrations',
		'manage-outgoing-integrations',
		'manage-own-incoming-integrations',
		'manage-own-outgoing-integrations',
	]);

	if (!canViewIntegrationsPage) {
		return <NotAuthorizedPage />;
	}

	return <IntegrationsPage />;
}

export default IntegrationsRoute;
