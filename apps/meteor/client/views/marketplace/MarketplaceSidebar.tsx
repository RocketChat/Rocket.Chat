import { useRoutePath, useCurrentRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { menu, SideNav } from '../../../app/ui-utils/client';
import Sidebar from '../../components/Sidebar';
import SidebarItemsAssemblerProps from '../../components/Sidebar/SidebarItemsAssembler';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';
import SettingsProvider from '../../providers/SettingsProvider';
import { getMarketplaceSidebarItems, subscribeToMarketplaceSidebarItems } from './sidebarItems';

const MarketplaceSidebar = (): ReactElement => {
	const items = useSyncExternalStore(subscribeToMarketplaceSidebarItems, getMarketplaceSidebarItems);
	const t = useTranslation();

	const closeMarketplaceFlex = useCallback(() => {
		if (isLayoutEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const [currentRouteName, currentRouteParams, currentQueryStringParams, currentRouteGroupName] = currentRoute;
	const currentPath = useRoutePath(currentRouteName ?? '', currentRouteParams, currentQueryStringParams);

	useEffect(() => {
		if (currentRouteGroupName !== 'marketplace') {
			SideNav.closeFlex();
		}
	}, [currentRouteGroupName]);

	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header onClose={closeMarketplaceFlex} title={<>{t('Marketplace')}</>} />
				<Sidebar.Content>
					<SidebarItemsAssemblerProps items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(MarketplaceSidebar);
