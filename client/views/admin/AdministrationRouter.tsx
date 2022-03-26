import React, { Suspense, ReactElement, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';

const AdministrationRouter = ({ renderRoute }: { renderRoute: () => ReactElement }): ReactElement => {
	const [routeName] = useCurrentRoute();
	const [upgradeTabType, trialEndDate] = useUpgradeTabParams();
	const defaultRoute = useRoute('admin-info');
	const upgradeRoute = useRoute('upgrade');

	useEffect(() => {
		if (routeName === 'admin-index' && upgradeTabType) {
			upgradeRoute.push({ type: upgradeTabType }, trialEndDate ? { trialEndDate } : undefined);
		}

		if (routeName === 'admin-index' && !upgradeTabType) {
			defaultRoute.push();
		}
	}, [defaultRoute, upgradeRoute, routeName, upgradeTabType, trialEndDate]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{renderRoute ? <Suspense fallback={<PageSkeleton />}>{renderRoute()}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
