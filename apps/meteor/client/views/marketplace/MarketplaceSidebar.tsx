import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useSyncExternalStore } from 'react';

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
		<SettingsProvider>
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
