import React, { useMemo } from 'react';

import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../../contexts/RouterContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import IntegrationsPage from './IntegrationsPage';
import NewIntegrationsPage from './new/NewIntegrationsPage';
import EditIntegrationsPage from './edit/EditIntegrationsPage';
import OutgoingWebhookHistoryPage from './edit/OutgoingWebhookHistoryPage';

function IntegrationsRoute() {
	const canViewIntegrationsPage = useAtLeastOnePermission(
		useMemo(() => [
			'manage-incoming-integrations',
			'manage-outgoing-integrations',
			'manage-own-incoming-integrations',
			'manage-own-outgoing-integrations',
		], []),
	);

	const context = useRouteParameter('context');

	if (!canViewIntegrationsPage) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <NewIntegrationsPage />;
	}

	if (context === 'edit') {
		return <EditIntegrationsPage />;
	}

	if (context === 'history') {
		return <OutgoingWebhookHistoryPage />;
	}

	return <IntegrationsPage />;
}

export default IntegrationsRoute;
