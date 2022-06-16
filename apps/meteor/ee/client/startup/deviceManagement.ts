import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../client/views/account';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerRoute, unregisterRoute] = registerAccountRoute('/device-management/', {
	name: 'device-management',
	component: lazy(() => import('../views/account/deviceManagement/DeviceManagementRoute')),
	ready: false,
});

onToggledFeature('device-management', {
	up: () =>
		Meteor.startup(() => {
			registerAccountSidebarItem({
				href: '/account/device-management',
				i18nLabel: 'Device Management',
				icon: 'desktop',
				permissionGranted: () => hasAllPermission('view-device-management'),
			});
			registerRoute();
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterSidebarItem('Device Management');
			unregisterRoute();
		}),
});
