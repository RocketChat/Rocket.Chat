import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 353,
	name: 'Rename the Outlook_Calendar settings group to Microsoft_Exchange',
	async up() {
		await Settings.updateMany({ group: 'Outlook_Calendar' }, { $set: { group: 'Microsoft_Exchange' } });
		await Settings.removeById('Outlook_Calendar');
	},
});
