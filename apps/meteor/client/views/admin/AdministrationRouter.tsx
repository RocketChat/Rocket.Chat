import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { useDefaultRoute } from '../../hooks/useDefaultRoute';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';
import { getAdminSidebarItems } from './sidebarItems';

type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps): ReactElement => {
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const [routeName] = useCurrentRoute();

	const defaultRoute = useDefaultRoute(getAdminSidebarItems, 'admin-info');
	const upgradeRoute = useRoute('upgrade');

	useEffect(() => {
		if (routeName !== 'admin-index') {
			return;
		}

		if (tabType && !isLoading) {
			upgradeRoute.replace({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
			return;
		}

		defaultRoute.replace();
	}, [upgradeRoute, routeName, tabType, trialEndDate, defaultRoute, isLoading]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
