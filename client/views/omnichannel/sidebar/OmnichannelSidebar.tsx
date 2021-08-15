import React, { useCallback, useEffect, FC, memo } from 'react';
import { useSubscription } from 'use-subscription';

import { menu, SideNav, Layout } from '../../../../app/ui-utils/client';
import Sidebar from '../../../components/Sidebar';
import { useRoutePath, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import SettingsProvider from '../../../providers/SettingsProvider';
import { itemsSubscription } from '../sidebarItems';

const OmnichannelSidebar: FC = () => {
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
	const [currentRouteName, currentRouteParams, currentQueryStringParams, currentRouteGroupName] =
		currentRoute;
	const currentPath = useRoutePath(
		currentRouteName ?? '',
		currentRouteParams,
		currentQueryStringParams,
	);

	useEffect(() => {
		if (currentRouteGroupName !== 'omnichannel') {
			SideNav.closeFlex();
		}
	}, [currentRouteGroupName]);

	return (
		<SettingsProvider privileged>
			<Sidebar>
				<Sidebar.Header onClose={closeOmnichannelFlex} title={<>{t('Omnichannel')}</>} />
				<Sidebar.Content>
					<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(OmnichannelSidebar);
