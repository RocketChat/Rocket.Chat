import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 351,
	name: 'Rename the Outlook_Calendar settings group to Microsoft_Exchange and Outlook_Calendar_Enabled to Microsoft_Exchange_Enabled',
	async up() {
		const legacySetting = await Settings.findOneById('Outlook_Calendar_Enabled');

		if (legacySetting) {
			await Settings.insertOne({
				...legacySetting,
				_id: 'Microsoft_Exchange_Enabled',
				group: 'Microsoft_Exchange',
				i18nLabel: 'Microsoft_Exchange_Enabled',
				i18nDescription: 'Microsoft_Exchange_Enabled_Description',
			});

			await Settings.removeById('Outlook_Calendar_Enabled');
		}

		await Settings.updateMany({ group: 'Outlook_Calendar' }, { $set: { group: 'Microsoft_Exchange' } });
		await Settings.removeById('Outlook_Calendar');
	},
});
