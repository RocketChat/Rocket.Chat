import { usePermission, useRouteParameter, useRouter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import GenericUpsellModal from '../../../../../client/components/GenericUpsellModal';
import PageSkeleton from '../../../../../client/components/PageSkeleton';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import { useIsEnterprise } from '../../../../../client/hooks/useIsEnterprise';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import EngagementDashboardPage from './EngagementDashboardPage';

const isValidTab = (tab: string | undefined): tab is 'users' | 'messages' | 'channels' =>
	typeof tab === 'string' && ['users', 'messages', 'channels'].includes(tab);

const EngagementDashboardRoute = (): ReactElement | null => {
	const t = useTranslation();
	const canViewEngagementDashboard = usePermission('view-engagement-dashboard');

	const { data } = useIsEnterprise();
	const hasEngagementDashboard = useHasLicenseModule('engagement-dashboard');
	const isUpsell = !data?.isEnterprise || !hasEngagementDashboard;

	const router = useRouter();
	const tab = useRouteParameter('tab');

	const setModal = useSetModal();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = useCallback(() => {
		setModal(
			<GenericUpsellModal
				title={t('Engagement_Dashboard')}
				img='images/engagement.png'
				subtitle={t('Analyze_practical_usage')}
				description={t('Enrich_your_workspace')}
				onCloseEffect={() => setIsModalOpen(false)}
			/>,
		);
		setIsModalOpen(true);
	}, [setModal, t]);

	useEffect(() => {
		if (isUpsell) {
			handleOpenModal();
			return;
		}

		const { tab } = router.getRouteParameters();

		if (!isValidTab(tab)) {
			router.navigate(
				{
					pattern: '/admin/engagement/:tab?',
					params: { tab: 'users' },
				},
				{ replace: true },
			);
		}

		return () => {
			setModal(null);
		};
	}, [handleOpenModal, isUpsell, router, setModal]);

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewEngagementDashboard || !hasEngagementDashboard) {
		return <NotAuthorizedPage />;
	}

	eventStats({
		params: [{ eventName: 'updateCounter', settingsId: 'Engagement_Dashboard_Load_Count' }],
	});
	return (
		<EngagementDashboardPage
			tab={tab as 'users' | 'messages' | 'channels'}
			onSelectTab={(tab) =>
				router.navigate({
					pattern: '/admin/engagement/:tab?',
					params: { tab },
				})
			}
		/>
	);
};

export default EngagementDashboardRoute;
