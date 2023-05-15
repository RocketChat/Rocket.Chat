import { useRoute } from '@rocket.chat/ui-contexts';

import type { SidebarItem } from '../lib/createSidebarItems';

export const useDefaultRoute = (getSidebarItems: () => SidebarItem[], fallbackRoute: string): ReturnType<typeof useRoute> => {
	const defaultRouteHref = getSidebarItems().find((sidebarItem) => sidebarItem.permissionGranted?.())?.href || fallbackRoute;
	const defaultRoute = useRoute(defaultRouteHref);

	return defaultRoute;
};
