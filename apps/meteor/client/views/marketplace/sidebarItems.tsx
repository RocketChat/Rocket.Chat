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
		permissionGranted: (): boolean => hasPermission('access-marketplace'),
	},
	{
		href: 'marketplace/enterprise',
		icon: 'lightning',
		i18nLabel: 'Enterprise',
		permissionGranted: (): boolean => hasPermission('access-marketplace'),
	},
	{
		href: 'marketplace/installed',
		icon: 'circle-arrow-down',
		i18nLabel: 'Installed',
		permissionGranted: (): boolean => hasPermission('access-marketplace'),
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
		permissionGranted: (): boolean => hasPermission('access-marketplace'),
	},
	{ divider: true, i18nLabel: 'marketplace/private', permissionGranted: (): boolean => hasPermission('access-marketplace') },
	{
		href: 'https://go.rocket.chat/i/developing-an-app',
		icon: 'new-window',
		i18nLabel: 'Documentation',
		externalUrl: true,
		permissionGranted: (): boolean => hasPermission('access-marketplace'),
	},
	{ divider: true, i18nLabel: 'marketplace/Documentation', permissionGranted: (): boolean => hasPermission('access-marketplace') },
]);
