
import React, { useCallback, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../../contexts/RouterContext';
import { useAbsoluteUrl } from '../../contexts/ServerContext';
import Sidebar from '../../components/basic/Sidebar';
import SettingsProvider from '../../providers/SettingsProvider';
import { itemsSubscription } from '../sidebarItems';

export default React.memo(function OmnichannelSidebar() {
	const items = useSubscription(itemsSubscription);
	const t = useTranslation();

	const closeOmnichannelFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const currentPath = useRoutePath(...currentRoute);
	const absoluteUrl = useAbsoluteUrl();
	const pathSection = 'omnichannel';

	useEffect(() => {
		const { pathname: omnichannelPath } = new URL(absoluteUrl('omnichannel/'));
		console.log(omnichannelPath);
		if (!currentPath.startsWith(omnichannelPath)) {
			SideNav.closeFlex();
		}
	}, [absoluteUrl, currentPath]);

	return <SettingsProvider privileged>
		<Sidebar>
			<Sidebar.Header onClose={closeOmnichannelFlex} title={<>{t('Omnichannel')}</>}/>
			<Sidebar.Content>
				<Sidebar.ItemsAssembler pathSection={pathSection} items={items} currentPath={currentPath}/>
			</Sidebar.Content>
		</Sidebar>
	</SettingsProvider>;
});
