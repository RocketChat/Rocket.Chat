import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../client/views/account';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerAdminRouter, unregisterAdminRoute] = registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	component: lazy(() => import('../views/admin/deviceManagement/DeviceManagementRoute')),
	ready: false,
});

const [registerAccountRouter, unregisterAccountRoute] = registerAccountRoute('/device-management/', {
	name: 'my-devices',
	component: lazy(() => import('../views/account/deviceManagement/DeviceManagementRoute')),
});

onToggledFeature('device-management', {
	up: () =>
		Meteor.startup(() => {
			registerAdminSidebarItem({
				href: '/admin/device-management',
				i18nLabel: 'Device_Management',
				icon: 'mobile',
				permissionGranted: () => hasAllPermission('view-device-management'),
			});
			registerAccountSidebarItem({
				href: '/account/device-management',
				i18nLabel: 'Device_Management',
				icon: 'desktop',
			});
			registerAdminRouter();
			registerAccountRouter();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterAdminSidebarItem('Device_Management');
			unregisterSidebarItem('Device_Management');
			unregisterAdminRoute();
			unregisterAccountRoute();
		}),
});
