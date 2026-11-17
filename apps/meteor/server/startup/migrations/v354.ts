import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 354,
	name: 'Remove the legacy per-user Outlook desktop integration: delete the Exchange_Mode, Outlook_Calendar_Exchange_Url, Outlook_Calendar_Url_Mapping and Calendar_MeetingUrl_Regex settings',
	async up() {
		await Settings.deleteMany({
			_id: { $in: ['Exchange_Mode', 'Outlook_Calendar_Exchange_Url', 'Outlook_Calendar_Url_Mapping', 'Calendar_MeetingUrl_Regex'] },
		});
	},
});
