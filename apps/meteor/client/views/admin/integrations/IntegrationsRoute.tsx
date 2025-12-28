import { useRouteParameter, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import EditIntegrationsPage from './EditIntegrationsPage';
import EditIntegrationsPageWithData from './EditIntegrationsPageWithData';
import IntegrationsPage from './IntegrationsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import OutgoingWebhookHistoryPage from './outgoing/history/OutgoingWebhookHistoryPage';

const IntegrationsRoute = () => {
	const context = useRouteParameter('context');
	const integrationId = useRouteParameter('id');

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

	if (!canViewIntegrationsPage) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <EditIntegrationsPage />;
	}

	if (context === 'edit' && integrationId) {
		return <EditIntegrationsPageWithData integrationId={integrationId} />;
	}

	if (context === 'history') {
		return <OutgoingWebhookHistoryPage />;
	}

	return <IntegrationsPage />;
};

export default IntegrationsRoute;
