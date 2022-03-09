import React, { ReactElement, useEffect } from 'react';

import NotAuthorizedPage from '../../../../../client/components/NotAuthorizedPage';
import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useCurrentRoute, useRoute } from '../../../../../client/contexts/RouterContext';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import EngagementDashboardPage from './EngagementDashboardPage';

const isValidTab = (tab: string | undefined): tab is 'users' | 'messages' | 'channels' =>
	typeof tab === 'string' && ['users', 'messages', 'channels'].includes(tab);

const EngagementDashboardRoute = (): ReactElement | null => {
	const canViewEngagementDashboard = usePermission('view-engagement-dashboard');
	const engagementDashboardRoute = useRoute('engagement-dashboard');
	const [routeName, routeParams] = useCurrentRoute();
	const { tab } = routeParams ?? {};

	useEffect(() => {
		if (routeName !== 'engagement-dashboard') {
			return;
		}

		if (!isValidTab(tab)) {
			engagementDashboardRoute.replace({ tab: 'users' });
		}
	}, [routeName, engagementDashboardRoute, tab]);

	const statsEvent = useEndpointAction('POST', 'statistics.telemetry', [{ eventName: 'engagementDashboard', timestamp: 123 }]);
	if (!isValidTab(tab)) {
		return null;
	}

	if (!canViewEngagementDashboard) {
		return <NotAuthorizedPage />;
	}

	statsEvent();
	return <EngagementDashboardPage tab={tab} onSelectTab={(tab): void => engagementDashboardRoute.push({ tab })} />;
};

export default EngagementDashboardRoute;
