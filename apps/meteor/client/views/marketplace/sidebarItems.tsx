import MarketplaceRequestBadge from './components/MarketplaceRequestBadge';
import { hasAtLeastOnePermission, hasPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerMarketplaceSidebarItem,
	unregisterSidebarItem: unregisterMarketplaceSidebarItem,
	getSidebarItems: getMarketplaceSidebarItems,
	subscribeToSidebarItems: subscribeToMarketplaceSidebarItems,
} = createSidebarItems([
	{
		href: '/marketplace/explore',
		icon: 'compass',
		i18nLabel: 'Explore',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-marketplace', 'manage-apps']),
	},
	{
		href: '/marketplace/premium',
		icon: 'lightning',
		i18nLabel: 'Premium',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-marketplace', 'manage-apps']),
	},
	{
		href: '/marketplace/installed',
		icon: 'circle-arrow-down',
		i18nLabel: 'Installed',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-marketplace', 'manage-apps']),
	},
	{
		href: '/marketplace/requested',
		icon: 'cube',
		i18nLabel: 'Requested',
		badge: () => <MarketplaceRequestBadge />,
		permissionGranted: (): boolean => hasPermission('manage-apps'),
	},
	{
		href: '/marketplace/private',
		icon: 'lock',
		i18nLabel: 'Private_Apps',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-marketplace', 'manage-apps']),
	},
	{ divider: true, i18nLabel: 'marketplace/private', permissionGranted: (): boolean => hasPermission('access-marketplace') },
	{
		href: 'https://go.rocket.chat/i/developing-an-app',
		icon: 'new-window',
		i18nLabel: 'Documentation',
		externalUrl: true,
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-marketplace', 'manage-apps']),
	},
	{ divider: true, i18nLabel: 'marketplace/Documentation', permissionGranted: (): boolean => hasPermission('access-marketplace') },
]);
