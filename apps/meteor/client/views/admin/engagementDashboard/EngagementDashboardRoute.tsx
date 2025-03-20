import {
	usePermission,
	useRouter,
	useSetModal,
	useCurrentModal,
	useTranslation,
	useRouteParameter,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import EngagementDashboardPage from './EngagementDashboardPage';
import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const isValidTab = (tab: string | undefined): tab is 'users' | 'messages' | 'channels' =>
	typeof tab === 'string' && ['users', 'messages', 'channels'].includes(tab);

const EngagementDashboardRoute = (): ReactElement | null => {
	const t = useTranslation();
	const canViewEngagementDashboard = usePermission('view-engagement-dashboard');
	const setModal = useSetModal();
	const isModalOpen = !!useCurrentModal();

	const router = useRouter();
	const tab = useRouteParameter('tab');
	const eventStats = useEndpoint('POST', '/v1/statistics.telemetry');

	const hasEngagementDashboard = useHasLicenseModule('engagement-dashboard') as boolean;

	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasEngagementDashboard);

	useEffect(() => {
		if (shouldShowUpsell) {
			setModal(
				<GenericUpsellModal
					aria-label={t('Engagement_Dashboard')}
					title={t('Engagement_Dashboard')}
					img={getURL('images/engagement.png')}
					subtitle={t('Analyze_practical_usage')}
					description={t('Enrich_your_workspace')}
					onClose={() => setModal(null)}
					onConfirm={handleManageSubscription}
					onCancel={() => setModal(null)}
				/>,
			);
		}

		router.subscribeToRouteChange(() => {
			if (!isValidTab(tab)) {
				router.navigate(
					{
						pattern: '/admin/engagement/:tab?',
						params: { tab: 'users' },
					},
					{ replace: true },
				);
			}
		});
	}, [shouldShowUpsell, router, tab, setModal, t, handleManageSubscription]);

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
