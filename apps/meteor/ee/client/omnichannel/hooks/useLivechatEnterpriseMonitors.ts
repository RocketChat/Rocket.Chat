import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { registerOmnichannelRoute } from '../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-monitors': {
			pattern: '/omnichannel/monitors';
			pathname: '/omnichannel/monitors';
		};
	}
}

export const useLivechatEnterpriseMonitors = () => {
	const licensed = useHasLicenseModule('livechat-enterprise');
	const permittedToManage = usePermission('manage-livechat-monitors');

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/monitors', {
			name: 'omnichannel-monitors',
			component: lazy(() => import('../monitors/MonitorsPageContainer')),
		});

		registerOmnichannelSidebarItem({
			href: '/omnichannel/monitors',
			i18nLabel: 'Livechat_Monitors',
		});

		return () => {
			unregisterOmnichannelRoute();
			unregisterOmnichannelSidebarItem('Livechat_Monitors');
		};
	}, [licensed, permittedToManage]);
};
