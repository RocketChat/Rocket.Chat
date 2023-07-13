import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { registerOmnichannelRoute } from '../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-priorities': {
			pattern: '/omnichannel/priorities/:context?/:id?';
			pathname: `/omnichannel/priorities${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const useLivechatEnterprisePriorities = () => {
	const licensed = useHasLicenseModule('livechat-enterprise');
	const permittedToManage = usePermission('manage-livechat-priorities');

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/priorities/:context?/:id?', {
			name: 'omnichannel-priorities',
			component: lazy(() => import('../priorities/PrioritiesRoute')),
		});

		registerOmnichannelSidebarItem({
			href: '/omnichannel/priorities',
			i18nLabel: 'Priorities',
		});

		return () => {
			unregisterOmnichannelRoute();
			unregisterOmnichannelSidebarItem('Priorities');
		};
	}, [licensed, permittedToManage]);
};
