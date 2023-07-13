import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { registerOmnichannelRoute } from '../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-tags': {
			pattern: '/omnichannel/tags/:context?/:id?';
			pathname: `/omnichannel/tags${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const useLivechatEnterpriseTags = () => {
	const licensed = useHasLicenseModule('livechat-enterprise') === true;
	const permittedToManage = usePermission('manage-livechat-tags');

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/tags/:context?/:id?', {
			name: 'omnichannel-tags',
			component: lazy(() => import('../tags/TagsRoute')),
		});

		registerOmnichannelSidebarItem({
			href: '/omnichannel/tags',
			i18nLabel: 'Tags',
		});

		return () => {
			unregisterOmnichannelRoute();
			unregisterOmnichannelSidebarItem('Tags');
		};
	}, [licensed, permittedToManage]);
};
