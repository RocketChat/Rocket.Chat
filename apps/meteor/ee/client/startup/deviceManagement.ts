import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import DeviceManagementFeatureModal from '../deviceManagement/components/featureModal/DeviceManagementFeatureModal';
import { onToggledFeature } from '../lib/onToggledFeature';

const [registerRoute, unregisterRoute] = registerAdminRoute('/device-management/:context?/:id?', {
	name: 'device-management',
	component: lazy(() => import('../views/admin/deviceManagement/DeviceManagementRoute')),
	ready: false,
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
			registerRoute();

			imperativeModal.open({
				component: DeviceManagementFeatureModal,
				props: {
					close: imperativeModal.close,
				},
			});
		}),
	down: () =>
		Meteor.startup(() => {
			unregisterAdminSidebarItem('Device_Management');
			unregisterRoute();
		}),
});
