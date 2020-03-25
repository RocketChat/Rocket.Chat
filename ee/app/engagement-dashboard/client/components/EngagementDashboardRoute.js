import React, { useEffect } from 'react';

import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useAdminSideNav } from '../../../../../client/hooks/useAdminSideNav';
import { EngagementDashboardPage } from './EngagementDashboardPage';

export function EngagementDashboardRoute() {
	useAdminSideNav();

	const goToEngagementDashboard = useRoute('engagement-dashboard');

	const tab = useRouteParameter('tab');

	useEffect(() => {
		if (!tab) {
			goToEngagementDashboard.replacingState({ tab: 'users' });
		}
	}, [tab]);

	return <EngagementDashboardPage
		tab={tab}
		onSelectTab={(tab) => goToEngagementDashboard({ tab })}
	/>;
}
