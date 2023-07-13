import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { registerOmnichannelRoute } from '../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-units': {
			pattern: '/omnichannel/units/:context?/:id?';
			pathname: `/omnichannel/units${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const useLivechatEnterpriseUnits = () => {
	const licensed = useHasLicenseModule('livechat-enterprise') === true;
	const permittedToManage = usePermission('manage-livechat-units');

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/units/:context?/:id?', {
			name: 'omnichannel-units',
			component: lazy(() => import('../units/UnitsRoute')),
		});

		registerOmnichannelSidebarItem({
			href: '/omnichannel/units',
			i18nLabel: 'Units',
		});

		return () => {
			unregisterOmnichannelRoute();
			unregisterOmnichannelSidebarItem('Units');
		};
	}, [licensed, permittedToManage]);
};
