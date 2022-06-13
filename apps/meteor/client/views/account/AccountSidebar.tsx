import { useRoutePath, useCurrentRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useCallback, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { itemsSubscription } from '.';
import { menu, SideNav } from '../../../app/ui-utils/client';
import Sidebar from '../../components/Sidebar';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';
import SettingsProvider from '../../providers/SettingsProvider';

const AccountSidebar = (): ReactElement => {
	const t = useTranslation();

	const items = useSubscription(itemsSubscription);

	const closeFlex = useCallback(() => {
		if (isLayoutEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const [currentRouteName, currentRouteParams, currentQueryStringParams, currentRouteGroupName] = currentRoute;
	const currentPath = useRoutePath(currentRouteName || '', currentRouteParams, currentQueryStringParams);

	useEffect(() => {
		if (currentRouteGroupName !== 'account') {
			SideNav.closeFlex();
		}
	}, [currentRouteGroupName]);

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
