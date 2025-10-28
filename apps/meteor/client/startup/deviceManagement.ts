import { lazy } from 'react';

import { onToggledFeature } from '../lib/onToggledFeature';
import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../views/account';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'manage-devices': {
			pathname: '/account/manage-devices';
			pattern: '/account/manage-devices';
		};
	}
}

const [registerAccountRouter, unregisterAccountRouter] = registerAccountRoute('/manage-devices', {
	name: 'manage-devices',
	component: lazy(() => import('../views/account/deviceManagement/DeviceManagementAccountPage')),
});

onToggledFeature('device-management', {
	up: () => {
		registerAccountSidebarItem({
			href: '/account/manage-devices',
			i18nLabel: 'Manage_Devices',
			icon: 'mobile',
		});
		registerAccountRouter();
	},
	down: () => {
		unregisterSidebarItem('Manage_Devices');
		unregisterAccountRouter();
	},
});
