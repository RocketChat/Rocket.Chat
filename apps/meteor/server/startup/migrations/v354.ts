import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 354,
	name: 'Remove the legacy per-user Outlook desktop integration: turn the integration off where it ran in legacy mode, then delete the Exchange_Mode, Outlook_Calendar_Exchange_Url, Outlook_Calendar_Url_Mapping and Calendar_MeetingUrl_Regex settings',
	async up() {
		const mode = await Settings.findOne({ _id: 'Exchange_Mode' }, { projection: { value: 1 } });
		if (mode?.value !== 'server') {
			await Settings.updateOne({ _id: 'Outlook_Calendar_Enabled' }, { $set: { value: false } });
		}

		await Settings.deleteMany({
			_id: { $in: ['Exchange_Mode', 'Outlook_Calendar_Exchange_Url', 'Outlook_Calendar_Url_Mapping', 'Calendar_MeetingUrl_Regex'] },
		});
	},
});
