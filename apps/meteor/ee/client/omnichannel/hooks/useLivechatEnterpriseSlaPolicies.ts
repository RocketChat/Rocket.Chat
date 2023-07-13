import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { registerOmnichannelRoute } from '../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-sla-policies': {
			pattern: '/omnichannel/sla-policies/:context?/:id?';
			pathname: `/omnichannel/sla-policies${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const useLivechatEnterpriseSlaPolicies = () => {
	const licensed = useHasLicenseModule('livechat-enterprise');
	const permittedToManage = usePermission('manage-livechat-sla');

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/sla-policies/:context?/:id?', {
			name: 'omnichannel-sla-policies',
			component: lazy(() => import('../slaPolicies/SlaRoute')),
		});

		registerOmnichannelSidebarItem({
			href: '/omnichannel/sla-policies',
			i18nLabel: 'SLA_Policies',
		});

		return () => {
			unregisterOmnichannelRoute();
			unregisterOmnichannelSidebarItem('SLA_Policies');
		};
	}, [licensed, permittedToManage]);
};
