import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { Suspense, ReactElement, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';

const AdministrationRouter = ({ renderRoute }: { renderRoute: () => ReactElement }): ReactElement => {
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('admin-info');
	const upgradeRoute = useRoute('upgrade');

	useEffect(() => {
		if (isLoading || routeName !== 'admin-index') {
			return;
		}

		if (tabType) {
			upgradeRoute.replace({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
			return;
		}

		defaultRoute.replace();
	}, [defaultRoute, upgradeRoute, routeName, tabType, trialEndDate, isLoading]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{renderRoute ? <Suspense fallback={<PageSkeleton />}>{renderRoute()}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
