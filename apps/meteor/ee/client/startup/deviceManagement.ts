import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../client/views/account';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerAdminRouter, unregisterAdminRouter] = registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	component: lazy(() => import('../views/admin/deviceManagement/DeviceManagementAdminRoute')),
	ready: false,
});

const [registerAccountRouter, unregisterAccountRouter] = registerAccountRoute('/manage-devices/', {
	name: 'manage-devices',
	component: lazy(() => import('../views/account/deviceManagement/DeviceManagementAccountPage')),
});

onToggledFeature('device-management', {
	up: () => {
		registerAdminSidebarItem({
			href: '/admin/device-management',
			i18nLabel: 'Device_Management',
			icon: 'mobile',
			permissionGranted: () => hasAllPermission('view-device-management'),
		});
		registerAccountSidebarItem({
			href: '/account/manage-devices',
			i18nLabel: 'Manage_Devices',
			icon: 'mobile',
		});
		registerAdminRouter();
		registerAccountRouter();
	},
	down: () => {
		unregisterAdminSidebarItem('Device_Management');
		unregisterSidebarItem('Manage_Devices');
		unregisterAdminRouter();
		unregisterAccountRouter();
	},
});
