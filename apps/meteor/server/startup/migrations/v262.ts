import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 262,
	async up() {
		// in case server is being updated, we check setup wizard status to determine if should still create the initial channel
		const setupWizard = await Settings.getValueById('Show_Setup_Wizard');
		if (setupWizard === 'pending') {
			// if still pending for some reason, we need to create the initial channel, so keep the setting as false
			return;
		}
		// if the setup wizard is not pending anymore, we assume initial channel was already created once
		await Settings.updateValueById('Initial_Channel_Created', true);
	},
});
