import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerMarketplaceSidebarItem,
	unregisterSidebarItem: unregisterMarketplaceSidebarItem,
	getSidebarItems: getMarketplaceSidebarItems,
	subscribeToSidebarItems: subscribeToMarketplaceSidebarItems,
} = createSidebarItems([
	{
		href: 'marketplace/explore/list',
		icon: 'compass',
		i18nLabel: 'Explore',
	},
	{
		href: 'marketplace/enterprise/list',
		icon: 'lightning',
		i18nLabel: 'Enterprise',
	},
	{
		href: 'marketplace/installed/list',
		icon: 'circle-arrow-down',
		i18nLabel: 'Installed',
	},
	{
		href: 'marketplace/private/list',
		icon: 'lock',
		i18nLabel: 'Private_Apps',
		divider: true,
	},
	{
		href: 'https://go.rocket.chat/i/developing-an-app',
		icon: 'new-window',
		i18nLabel: 'Documentation',
		divider: true,
		externalUrl: true,
	},
]);
