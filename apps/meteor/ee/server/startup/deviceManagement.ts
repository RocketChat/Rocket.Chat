import { Meteor } from 'meteor/meteor';

import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('device-management', {
	up: () =>
		Meteor.startup(async () => {
			const { createPermissions } = await import('../lib/deviceManagement/startup');
			const { listenSessionLogin } = await import('../lib/deviceManagement/session');
			await createPermissions();
			await listenSessionLogin();
		}),
});
