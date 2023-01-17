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
		textColor: 'stroke-extra-dark',
		i18nLabel: 'Explore',
	},
	{
		href: 'marketplace/enterprise/list',
		icon: 'lightning',
		textColor: 'stroke-extra-dark',
		i18nLabel: 'Enterprise',
	},
	{
		href: 'marketplace/installed/list',
		icon: 'circle-arrow-down',
		textColor: 'stroke-extra-dark',
		i18nLabel: 'Installed',
	},
	{
		href: 'marketplace/private/list',
		icon: 'lock',
		i18nLabel: 'Private_Apps',
		textColor: 'stroke-extra-dark',
		divider: true,
	},
	{
		i18nLabel: 'Documentation',
		icon: 'new-window',
		divider: true,
		textColor: 'stroke-dark',
		href: 'https://go.rocket.chat/i/developing-an-app',
		externalUrl: true,
	},
]);
