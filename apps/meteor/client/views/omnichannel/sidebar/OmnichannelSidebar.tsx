import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { memo, useSyncExternalStore } from 'react';

import Sidebar from '../../../components/Sidebar';
import SidebarItemsAssemblerProps from '../../../components/Sidebar/SidebarItemsAssembler';
import SettingsProvider from '../../../providers/SettingsProvider';
import { getOmnichannelSidebarItems, subscribeToOmnichannelSidebarItems } from '../sidebarItems';

const OmnichannelSidebar = () => {
	const items = useSyncExternalStore(subscribeToOmnichannelSidebarItems, getOmnichannelSidebarItems);
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

	return (
		<SettingsProvider>
			<Sidebar>
				<Sidebar.Header onClose={sidebar.close} title={t('Omnichannel')} />
				<Sidebar.Content>
					<SidebarItemsAssemblerProps items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(OmnichannelSidebar);
