import { useRoutePath, useCurrentRoute, useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import Sidebar from '../../../components/Sidebar';
import SidebarItemsAssemblerProps from '../../../components/Sidebar/SidebarItemsAssembler';
import SettingsProvider from '../../../providers/SettingsProvider';
import { getOmnichannelSidebarItems, subscribeToOmnichannelSidebarItems } from '../sidebarItems';

const OmnichannelSidebar: FC = () => {
	const items = useSyncExternalStore(subscribeToOmnichannelSidebarItems, getOmnichannelSidebarItems);
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentRoute = useCurrentRoute();
	const [currentRouteName, currentRouteParams, currentQueryStringParams] = currentRoute;
	const currentPath = useRoutePath(currentRouteName ?? '', currentRouteParams, currentQueryStringParams);

	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header onClose={sidebar.close} title={<>{t('Omnichannel')}</>} />
				<Sidebar.Content>
					<SidebarItemsAssemblerProps items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(OmnichannelSidebar);
