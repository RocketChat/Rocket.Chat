import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

function syncAbacAttributes() {
	// Listen for setting changes
	settings.watch('ABAC_Enabled', async (value) => {
		if (value) {
			await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
		}
	});
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
