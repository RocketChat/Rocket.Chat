import React, { useEffect } from 'react';

import { useCurrentRoute, useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { EngagementDashboardPage } from './EngagementDashboardPage';

export function EngagementDashboardRoute() {
	const engagementDashboardRoute = useRoute('engagement-dashboard');
	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('tab');

	useEffect(() => {
		if (routeName !== 'engagement-dashboard') {
			return;
		}

		if (!tab) {
			engagementDashboardRoute.replace({ tab: 'users' });
		}
	}, [routeName, engagementDashboardRoute, tab]);

	return <EngagementDashboardPage
		tab={tab}
		onSelectTab={(tab) => engagementDashboardRoute.push({ tab })}
	/>;
}

export default EngagementDashboardRoute;
