import { useRoutePath, useCurrentRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { menu, SideNav } from '../../../app/ui-utils/client';
import Sidebar from '../../components/Sidebar';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';
import SettingsProvider from '../../providers/SettingsProvider';
import { itemsSubscription } from './sidebarItems';

const AccountSidebar = () => {
	const t = useTranslation();

	const items = useSubscription(itemsSubscription);

	const closeFlex = useCallback(() => {
		if (isLayoutEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const [currentRouteName, ...rest] = useCurrentRoute();
	const currentPath = useRoutePath(currentRouteName, ...rest);

	useEffect(() => {
		if (currentRouteName !== 'account') {
			SideNav.closeFlex();
		}
	}, [currentRouteName]);

	// TODO: uplift this provider
	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header onClose={closeFlex} title={t('Account')} />
				<Sidebar.Content>
					<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AccountSidebar);
