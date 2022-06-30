import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { registerAccountRoute, registerAccountSidebarItem, unregisterSidebarItem } from '../../../client/views/account';
import { registerAdminRoute, registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../../client/views/admin';
import DeviceManagementFeatureModal from '../deviceManagement/components/featureModal/DeviceManagementFeatureModal';
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

const handleDeviceManagementFeatureModal = (): void => {
	Meteor.call('findDeviceManagementModal', (error: Error, hasUserAcknowledged: boolean) => {
		if (error) {
			console.error(error);
			return;
		}

		if (!hasUserAcknowledged) {
			imperativeModal.open({
				component: DeviceManagementFeatureModal,
				props: {
					close: imperativeModal.close,
				},
			});
		}
	});
};

onToggledFeature('device-management', {
	up: () => {
		console.log('MDM enabled');
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

		handleDeviceManagementFeatureModal();
	},
	down: () => {
		unregisterAdminSidebarItem('Device_Management');
		unregisterSidebarItem('Manage_Devices');
		unregisterAdminRouter();
		unregisterAccountRouter();
	},
});
