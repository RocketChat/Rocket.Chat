import { usePermission, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import EngagementDashboardPage from './EngagementDashboardPage';

const isValidTab = (tab: string | undefined): tab is 'users' | 'messages' | 'channels' =>
	typeof tab === 'string' && ['users', 'messages', 'channels'].includes(tab);

const EngagementDashboardRoute = (): ReactElement | null => {
	const canViewEngagementDashboard = usePermission('view-engagement-dashboard');
	const router = useRouter();
	const tab = useRouteParameter('tab');

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'engagement-dashboard') {
					return;
				}

				const { tab } = router.getRouteParameters();

				if (!isValidTab(tab)) {
					router.navigate(
						{
							pattern: '/admin/engagement-dashboard/:tab?',
							params: { tab: 'users' },
						},
						{ replace: true },
					);
				}
			}),
		[router],
	);

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');

	if (!isValidTab(tab)) {
		return null;
	}

	if (!canViewEngagementDashboard) {
		return <NotAuthorizedPage />;
	}

	eventStats({
		params: [{ eventName: 'updateCounter', settingsId: 'Engagement_Dashboard_Load_Count' }],
	});
	return (
		<EngagementDashboardPage
			tab={tab}
			onSelectTab={(tab) =>
				router.navigate({
					pattern: '/admin/engagement-dashboard/:tab?',
					params: { tab },
				})
			}
		/>
	);
};

export default EngagementDashboardRoute;
