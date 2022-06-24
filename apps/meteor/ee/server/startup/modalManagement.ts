import { Meteor } from 'meteor/meteor';

import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('modal-management', {
	up: () =>
		Meteor.startup(async () => {
			const { createPermissions } = await import('../lib/modalManagement/startup');
			await createPermissions();
		}),
});
