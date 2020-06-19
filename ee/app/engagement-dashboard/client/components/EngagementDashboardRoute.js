import React, { useEffect } from 'react';

import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { EngagementDashboardPage } from './EngagementDashboardPage';

export function EngagementDashboardRoute() {
	const engagementDashboardRoute = useRoute('engagement-dashboard');

	const tab = useRouteParameter('tab');

	useEffect(() => {
		if (!tab) {
			engagementDashboardRoute.replace({ tab: 'users' });
		}
	}, [engagementDashboardRoute, tab]);

	return <EngagementDashboardPage
		tab={tab}
		onSelectTab={(tab) => engagementDashboardRoute.push({ tab })}
	/>;
}

export default EngagementDashboardRoute;
