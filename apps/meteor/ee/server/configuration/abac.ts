import { License } from '@rocket.chat/license';

Meteor.startup(async () => {
	await License.onLicense('abac', async () => {
		const { addSettings } = await import('../settings/abac');
		await addSettings();
	});
});
