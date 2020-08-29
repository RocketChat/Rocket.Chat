import React, { useCallback, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { menu, SideNav, Layout } from '../../app/ui-utils/client';
import { useTranslation } from '../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../contexts/RouterContext';
import Sidebar from '../components/basic/Sidebar';
import SettingsProvider from '../providers/SettingsProvider';
import { itemsSubscription } from './sidebarItems';

export default React.memo(function AccountSidebar() {
	const t = useTranslation();

	const items = useSubscription(itemsSubscription);

	const closeFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
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
	return <SettingsProvider privileged>
		<Sidebar>
			<Sidebar.Header onClose={closeFlex} title={t('Account')}/>
			<Sidebar.Content>
				<Sidebar.ItemsAssembler items={items} currentPath={currentPath}/>
			</Sidebar.Content>
		</Sidebar>
	</SettingsProvider>;
});
