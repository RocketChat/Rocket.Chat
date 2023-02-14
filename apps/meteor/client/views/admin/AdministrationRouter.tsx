import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';

type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps): ReactElement => {
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
				{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
