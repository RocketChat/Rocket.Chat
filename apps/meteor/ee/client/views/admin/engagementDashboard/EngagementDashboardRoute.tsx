import { useCurrentRoute, useRoute, usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect } from 'react';

import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
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

	const eventStats = useEndpointAction('POST', 'statistics.telemetry', {
		params: [{ eventName: 'updateCounter', settingsId: 'Engagement_Dashboard_Load_Count' }],
	});

	if (!isValidTab(tab)) {
		return null;
	}

	if (!canViewEngagementDashboard) {
		return <NotAuthorizedPage />;
	}

	eventStats();
	return <EngagementDashboardPage tab={tab} onSelectTab={(tab): void => engagementDashboardRoute.push({ tab })} />;
};

export default EngagementDashboardRoute;
