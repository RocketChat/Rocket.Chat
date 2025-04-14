import { useCurrentRoutePath, useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import { memo, useSyncExternalStore } from 'react';

import { getAccountSidebarItems, subscribeToAccountSidebarItems } from './sidebarItems';
import Sidebar from '../../components/Sidebar';
import SettingsProvider from '../../providers/SettingsProvider';

const AccountSidebar = () => {
	const t = useTranslation();

	const items = useSyncExternalStore(subscribeToAccountSidebarItems, getAccountSidebarItems);

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

	// TODO: uplift this provider
	return (
		<SettingsProvider>
			<Sidebar>
				<Sidebar.Header onClose={sidebar.close} title={t('Account')} />
				<Sidebar.Content>
					<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AccountSidebar);
