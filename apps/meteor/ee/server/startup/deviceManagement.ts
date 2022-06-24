import { Meteor } from 'meteor/meteor';

import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('device-management', {
	up: () =>
		Meteor.startup(async () => {
			const { createPermissions, createDeviceManagementModal } = await import('../lib/deviceManagement/startup');
			await createPermissions();
			await createDeviceManagementModal();
			await import('../lib/deviceManagement/deviceManagementModal');
		}),
});
