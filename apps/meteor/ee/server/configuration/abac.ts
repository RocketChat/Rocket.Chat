import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

function syncAbacAttributes() {
	// Listen for setting changes
	// question? does this fire when a setting was disabled on CE and then enabled because of EE upgrade?
	settings.watch('ABAC_Enabled', async (value) => {
		console.log('------------------------------------------------------------------------');
		if (value) {
			await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
		}
	});

	// Initial sync if enabled after license is applied
	// This should only happen if the ws downgrades and then upgrades again
	// Checking if needed
	// if (settings.get('ABAC_Enabled')) {
	// 	await LDAPEE.syncAbacAttributes();
	// }
}

Meteor.startup(async () => {
	await License.onLicense('abac', async () => {
		const { addSettings } = await import('../settings/abac');
		const { createPermissions } = await import('../lib/abac');

		await addSettings();
		await createPermissions();

		await import('../hooks/abac');

		syncAbacAttributes();
	});
});
