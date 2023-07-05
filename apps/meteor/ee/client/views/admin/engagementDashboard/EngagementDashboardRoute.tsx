import { usePermission, useRouteParameter, useRouter, useSetModal, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import PageSkeleton from '../../../../../client/components/PageSkeleton';
import UpsellModal from '../../../../../client/components/UpsellModal';
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
	const cloudWorkspaceHadTrial = Boolean(useSetting('Cloud_Workspace_Had_Trial'));

	const { data } = useIsEnterprise();
	const hasEngagementDashboard = useHasLicenseModule('engagement-dashboard');
	const isUpsell = !data?.isEnterprise || !hasEngagementDashboard;

	const router = useRouter();
	const tab = useRouteParameter('tab');

	const setModal = useSetModal();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const handleModalClose = useCallback(() => {
		setModal(null);
		setIsModalOpen(false);
	}, [setModal]);

	const handleConfirmModal = useCallback(() => {
		handleModalClose();
		router.navigate({
			pathname: '/admin/upgrade',
			params: { type: 'go-fully-featured-registered' },
		});
	}, [handleModalClose, router]);

	const talkToSales = 'https://go.rocket.chat/i/contact-sales';
	const handleCancelModal = useCallback(() => {
		handleModalClose();
		window.open(talkToSales, '_blank');
	}, [handleModalClose]);

	const handleOpenModal = useCallback(() => {
		router.navigate({
			pattern: '/admin/engagement/:context?/:tab?',
			params: { context: 'upsell', tab: 'users' },
		});
		setModal(
			<UpsellModal
				title={t('Engagement_Dashboard')}
				img='images/engagement.png'
				subtitle={t('Analyze_practical_usage')}
				description={t('Enrich_your_workspace')}
				confirmText={cloudWorkspaceHadTrial ? t('Learn_more') : t('Start_a_free_trial')}
				cancelText={t('Talk_to_an_expert')}
				onConfirm={handleConfirmModal}
				onCancel={handleCancelModal}
				onClose={handleModalClose}
			/>,
		);
		setIsModalOpen(true);
	}, [cloudWorkspaceHadTrial, handleCancelModal, handleConfirmModal, handleModalClose, router, setModal, t]);

	useEffect(() => {
		router.subscribeToRouteChange(() => {
			if (router.getRouteName() !== 'engagement-dashboard') {
				return;
			}

			if (isUpsell) {
				handleOpenModal();
				return;
			}

			const { tab } = router.getRouteParameters();

			if (!isValidTab(tab)) {
				router.navigate(
					{
						pattern: '/admin/engagement/:context?/:tab?',
						params: { context: 'active', tab: 'users' },
					},
					{ replace: true },
				);
			}
		});

		return () => {
			handleModalClose();
		};
	}, [handleModalClose, handleOpenModal, isUpsell, router]);

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');

	if (!isValidTab(tab)) {
		return null;
	}

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
			tab={tab}
			onSelectTab={(tab) =>
				router.navigate({
					pattern: '/admin/engagement/:context?/:tab?',
					params: { context: 'active', tab },
				})
			}
		/>
	);
};

export default EngagementDashboardRoute;
