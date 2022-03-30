import React, { Suspense, ReactElement, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';

const AdministrationRouter = ({ renderRoute }: { renderRoute: () => ReactElement }): ReactElement => {
	const { data, isLoading } = useUpgradeTabParams();
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('admin-info');
	const upgradeRoute = useRoute('upgrade');

	useEffect(() => {
		if (isLoading || routeName !== 'admin-index') {
			return;
		}

		if (data?.tabType) {
			upgradeRoute.replace({ type: data?.tabType }, data?.trialEndDate ? { trialEndDate: data.trialEndDate } : undefined);
			return;
		}

		defaultRoute.replace();
	}, [defaultRoute, upgradeRoute, routeName, data?.tabType, data?.trialEndDate, isLoading, data]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{renderRoute ? <Suspense fallback={<PageSkeleton />}>{renderRoute()}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
