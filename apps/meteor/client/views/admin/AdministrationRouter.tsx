import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { Suspense, useEffect } from 'react';

import AdministrationLayout from './AdministrationLayout';
import { getAdminSidebarItems } from './sidebarItems';
import PageSkeleton from '../../components/PageSkeleton';
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

type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps): ReactElement => {
	const router = useRouter();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'admin-index') {
					return;
				}

				const defaultRoutePath = getAdminSidebarItems().find(firstSidebarPage)?.href ?? '/admin/workspace';

				if (isGoRocketChatLink(defaultRoutePath)) {
					window.open(defaultRoutePath, '_blank');
					return;
				}

				router.navigate(defaultRoutePath, { replace: true });
			}),
		[router],
	);

	return (
		<AdministrationLayout>
			<SettingsProvider>{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
