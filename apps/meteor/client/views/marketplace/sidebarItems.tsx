import React from 'react';

import { hasPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';
import MarketplaceRequestBadge from './components/MarketplaceRequestBadge';

export const {
	registerSidebarItem: registerMarketplaceSidebarItem,
	unregisterSidebarItem: unregisterMarketplaceSidebarItem,
	getSidebarItems: getMarketplaceSidebarItems,
	subscribeToSidebarItems: subscribeToMarketplaceSidebarItems,
} = createSidebarItems([
	{
		href: 'marketplace/explore',
		icon: 'compass',
		i18nLabel: 'Explore',
	},
	{
		href: 'marketplace/enterprise',
		icon: 'lightning',
		i18nLabel: 'Enterprise',
	},
	{
		href: 'marketplace/installed',
		icon: 'circle-arrow-down',
		i18nLabel: 'Installed',
	},
	{
		href: 'marketplace/requested',
		icon: 'cube',
		i18nLabel: 'Requested',
		badge: () => <MarketplaceRequestBadge />,
		permissionGranted: (): boolean => hasPermission('manage-apps'),
	},
	{
		href: 'marketplace/private',
		icon: 'lock',
		i18nLabel: 'Private_Apps',
	},
	{ divider: true, i18nLabel: 'marketplace/private' },
	{
		href: 'https://go.rocket.chat/i/developing-an-app',
		icon: 'new-window',
		i18nLabel: 'Documentation',
		externalUrl: true,
	},
	{ divider: true, i18nLabel: 'marketplace/Documentation' },
]);
