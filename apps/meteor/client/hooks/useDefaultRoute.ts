import { useRoute } from '@rocket.chat/ui-contexts';

import type { Item, SidebarDivider, SidebarItem } from '../lib/createSidebarItems';

const isSidebarDivider = (sidebarItem: SidebarItem): sidebarItem is SidebarDivider => {
	return (sidebarItem as SidebarDivider).divider === true;
};

const firstSidebarPage = (sidebarItem: SidebarItem): sidebarItem is Item => {
	if (isSidebarDivider(sidebarItem)) {
		return false;
	}

	return Boolean(sidebarItem.permissionGranted?.());
};

export const useDefaultRoute = (getSidebarItems: () => SidebarItem[], fallbackRoute: string): ReturnType<typeof useRoute> => {
	const defaultRouteHref = getSidebarItems().find(firstSidebarPage)?.href || fallbackRoute;
	const defaultRoute = useRoute(defaultRouteHref);

	return defaultRoute;
};
