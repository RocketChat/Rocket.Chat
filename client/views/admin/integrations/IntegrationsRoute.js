import React, { useMemo } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../../contexts/RouterContext';
import IntegrationsPage from './IntegrationsPage';
import EditIntegrationsPage from './edit/EditIntegrationsPage';
import OutgoingWebhookHistoryPage from './edit/OutgoingWebhookHistoryPage';
import NewIntegrationsPage from './new/NewIntegrationsPage';

function IntegrationsRoute() {
	const canViewIntegrationsPage = useAtLeastOnePermission(
		useMemo(
			() => [
				'manage-incoming-integrations',
				'manage-outgoing-integrations',
				'manage-own-incoming-integrations',
				'manage-own-outgoing-integrations',
			],
			[],
		),
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
