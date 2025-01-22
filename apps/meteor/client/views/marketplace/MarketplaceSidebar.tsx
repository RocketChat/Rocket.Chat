import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { getMarketplaceSidebarItems, subscribeToMarketplaceSidebarItems } from './sidebarItems';
import Sidebar from '../../components/Sidebar';
import SidebarItemsAssembler from '../../components/Sidebar/SidebarItemsAssembler';
import SettingsProvider from '../../providers/SettingsProvider';

const MarketplaceSidebar = (): ReactElement => {
	const items = useSyncExternalStore(subscribeToMarketplaceSidebarItems, getMarketplaceSidebarItems);
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header onClose={sidebar.close} title={t('Marketplace')} />
				<Sidebar.Content>
					<SidebarItemsAssembler items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(MarketplaceSidebar);
