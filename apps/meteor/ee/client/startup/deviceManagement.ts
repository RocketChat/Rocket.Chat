import { lazy } from 'react';

import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../client/views/account';
import { registerAdminRoute } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'device-management': {
			pathname: `/admin/device-management${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/admin/device-management/:context?/:id?';
		};
		'manage-devices': {
			pathname: '/account/manage-devices';
			pattern: '/account/manage-devices';
		};
	}
}

const [registerAdminRouter, unregisterAdminRouter] = registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	component: lazy(() => import('../views/admin/deviceManagement/DeviceManagementAdminRoute')),
	ready: false,
});

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
		registerAdminRouter();
		registerAccountRouter();
	},
	down: () => {
		unregisterSidebarItem('Manage_Devices');
		unregisterAdminRouter();
		unregisterAccountRouter();
	},
});
