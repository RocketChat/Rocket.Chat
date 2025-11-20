import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

Meteor.startup(async () => {
	let stopWatcher: () => void;
	License.onToggledFeature('abac', {
		up: async () => {
			const { addSettings } = await import('../settings/abac');
			const { createPermissions } = await import('../lib/abac');

			await addSettings();
			await createPermissions();

			await import('../hooks/abac');

			stopWatcher = settings.watch('ABAC_Enabled', async (value) => {
				if (value) {
					await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
				}
			});
		},
		down: () => {
			stopWatcher?.();
		},
	});
});
