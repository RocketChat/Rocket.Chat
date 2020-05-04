import React from 'react';

import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../contexts/RouterContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import IntegrationsPage from './IntegrationsPage';
import NewIntegrationsPage from './new/NewIntegrationsPage';

function IntegrationsRoute() {
	const canViewIntegrationsPage = useAtLeastOnePermission([
		'manage-incoming-integrations',
		'manage-outgoing-integrations',
		'manage-own-incoming-integrations',
		'manage-own-outgoing-integrations',
	]);

	const context = useRouteParameter('context');


	if (!canViewIntegrationsPage) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <NewIntegrationsPage />;
	}

	return <IntegrationsPage />;
}

export default IntegrationsRoute;
