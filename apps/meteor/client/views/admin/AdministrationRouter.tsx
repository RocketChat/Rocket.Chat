import { useRouter, useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import type { Item, SidebarDivider, SidebarItem } from '../../lib/createSidebarItems';
import { isGoRocketChatLink } from '../../lib/createSidebarItems';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';
import { getAdminSidebarItems } from './sidebarItems';

const isSidebarDivider = (sidebarItem: SidebarItem): sidebarItem is SidebarDivider => {
	return (sidebarItem as SidebarDivider).divider === true;
};

const firstSidebarPage = (sidebarItem: SidebarItem): sidebarItem is Item => {
	if (isSidebarDivider(sidebarItem)) {
		return false;
	}

	return Boolean(sidebarItem.permissionGranted?.());
};

type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps): ReactElement => {
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const [routeName] = useCurrentRoute();

	const upgradeRoute = useRoute('upgrade');
	const router = useRouter();

	useEffect(() => {
		if (routeName !== 'admin-index') {
			return;
		}

		if (tabType && !isLoading) {
			upgradeRoute.replace({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
			return;
		}

		const defaultRoutePath = getAdminSidebarItems().find(firstSidebarPage)?.href ?? '/admin/info';

		if (isGoRocketChatLink(defaultRoutePath)) {
			window.open(defaultRoutePath, '_blank');
			return;
		}

		router.navigate(defaultRoutePath, { replace: true });
	}, [upgradeRoute, routeName, tabType, trialEndDate, isLoading, router]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
