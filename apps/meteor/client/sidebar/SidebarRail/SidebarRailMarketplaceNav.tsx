import { useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import Sidebar from '../../components/Sidebar';
import SidebarItemsAssembler from '../../components/Sidebar/SidebarItemsAssembler';
import SettingsProvider from '../../providers/SettingsProvider';
import { getMarketplaceSidebarItems, subscribeToMarketplaceSidebarItems } from '../../views/marketplace/sidebarItems';

/**
 * The Marketplace's own sidebar, for the Marketplace modal: the same sections as on its pages, without the button that
 * closes the sidebar on small screens. Its links stay in the modal.
 */
const SidebarRailMarketplaceNav = () => {
	const { t } = useTranslation();
	const items = useSyncExternalStore(subscribeToMarketplaceSidebarItems, getMarketplaceSidebarItems);
	const currentPath = useCurrentRoutePath();

	return (
		<SettingsProvider>
			<Sidebar.Header title={t('Marketplace')} />
			<Sidebar.Content>
				<SidebarItemsAssembler items={items} currentPath={currentPath} />
			</Sidebar.Content>
		</SettingsProvider>
	);
};

export default SidebarRailMarketplaceNav;
