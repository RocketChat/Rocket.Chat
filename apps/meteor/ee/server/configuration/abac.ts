import { License } from '@rocket.chat/license';

Meteor.startup(async () => {
	await License.onLicense('abac', async () => {
		const { addSettings } = await import('../settings/abac');
		const { createPermissions } = await import('../lib/abac');

		await addSettings();
		await createPermissions();
	});
});
