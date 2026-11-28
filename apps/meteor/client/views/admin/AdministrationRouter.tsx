import { PageSkeleton } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { Suspense, useEffect } from 'react';

import AdministrationLayout from './AdministrationLayout';
import { getAdminSidebarItems } from './sidebarItems';
import { useExternalLink } from '../../hooks/useExternalLink';
import type { Item, SidebarDivider, SidebarItem } from '../../lib/createSidebarItems';
import { isGoRocketChatLink } from '../../lib/createSidebarItems';
import SettingsProvider from '../../providers/SettingsProvider';

const isSidebarDivider = (sidebarItem: SidebarItem): sidebarItem is SidebarDivider => {
	return (sidebarItem as SidebarDivider).divider === true;
};

const firstSidebarPage = (sidebarItem: SidebarItem): sidebarItem is Item => {
	if (isSidebarDivider(sidebarItem)) {
		return false;
	}

	return Boolean(sidebarItem.permissionGranted?.());
};

export type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps) => {
	const router = useRouter();
	const openExternalLink = useExternalLink();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'admin-index') {
					return;
				}

				const defaultRoutePath = getAdminSidebarItems().find(firstSidebarPage)?.href ?? '/admin/workspace';

				if (isGoRocketChatLink(defaultRoutePath)) {
					openExternalLink(defaultRoutePath);
					return;
				}

				router.navigate(defaultRoutePath, { replace: true });
			}),
		[router, openExternalLink],
	);

	return (
		<AdministrationLayout>
			<SettingsProvider>{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
