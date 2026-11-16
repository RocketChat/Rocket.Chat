import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 354,
	name: 'Remove the legacy per-user Outlook desktop integration: delete the Exchange_Mode, Outlook_Calendar_Exchange_Url and Outlook_Calendar_Url_Mapping settings',
	async up() {
		await Settings.deleteMany({ _id: { $in: ['Exchange_Mode', 'Outlook_Calendar_Exchange_Url', 'Outlook_Calendar_Url_Mapping'] } });
	},
});
