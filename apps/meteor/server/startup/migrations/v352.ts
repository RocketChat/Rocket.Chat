import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { settings } from '../../settings';

addMigration({
	version: 352,
	name: 'Rename the Outlook_Calendar settings group to Microsoft_Exchange and Outlook_Calendar_Enabled to Microsoft_Exchange_Enabled',
	async up() {
		const legacySetting = await Settings.findOneById('Outlook_Calendar_Enabled');

		if (legacySetting) {
			// A retry finds it already inserted when the previous run failed before removing the legacy setting
			if (await Settings.findOneById('Microsoft_Exchange_Enabled', { projection: { _id: 1 } })) {
				await Settings.updateValueById('Microsoft_Exchange_Enabled', legacySetting.value);
			} else {
				await Settings.insertOne({
					...legacySetting,
					_id: 'Microsoft_Exchange_Enabled',
					group: 'Microsoft_Exchange',
					i18nLabel: 'Microsoft_Exchange_Enabled',
					i18nDescription: 'Microsoft_Exchange_Enabled_Description',
				});
			}

			// The settings cache was loaded before migrations ran, and the registry inserts whatever it does not hold
			const migrated = await Settings.findOneById('Microsoft_Exchange_Enabled');
			if (migrated) {
				settings.set(migrated);
			}

			await Settings.removeById('Outlook_Calendar_Enabled');
		}

		await Settings.updateMany({ group: 'Outlook_Calendar' }, { $set: { group: 'Microsoft_Exchange' } });
		await Settings.removeById('Outlook_Calendar');
	},
});
