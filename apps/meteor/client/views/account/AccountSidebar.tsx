import { useCurrentRoutePath, useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { Sidebar, Content as SidebarContent, Header as SidebarHeader, SidebarItemsAssembler } from '../../components/Sidebar';
import SettingsProvider from '../../providers/SettingsProvider';
import { getAccountSidebarItems, subscribeToAccountSidebarItems } from './sidebarItems';

const AccountSidebar: FC = () => {
	const t = useTranslation();

	const items = useSyncExternalStore(subscribeToAccountSidebarItems, getAccountSidebarItems);

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

	// TODO: uplift this provider
	return (
		<SettingsProvider privileged>
			<Sidebar>
				<SidebarHeader onClose={sidebar.close} title={t('Account')} />
				<SidebarContent>
					<SidebarItemsAssembler items={items} currentPath={currentPath} />
				</SidebarContent>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AccountSidebar);
