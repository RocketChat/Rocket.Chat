import { Meteor } from 'meteor/meteor';
// import { Users } from '@rocket.chat/models';

import { onLicense } from '../../app/license/server';
import { addSettings } from '../settings/outlookCalendar';
// import { settings } from '../../../app/settings/server';
// import { VirtualDataConverter } from '../../../app/importer/server/classes/VirtualDataConverter';

// async function maybeCreateOutlookBot() {
// 	// Create the outlook bot if it doesn't exist.
// 	const botUser = await Users.findOneById('outlook-calendar.bot');
// 	if (!botUser) {
// 		VirtualDataConverter.convertSingleUser({
// 			_id: 'outlook-calendar.bot',
// 			username: 'outlook-calendar.bot',
// 			emails: [],
// 			importIds: ['outlook-calendar.bot'],
// 			name: 'Outlook Calendar',
// 			type: 'bot',
// 			roles: ['bot'],
// 		});
// 	}
// }

Meteor.startup(() =>
	onLicense('outlook-calendar', () => {
		// addSettings();

		// settings.watch('Outlook_Calendar_Enabled', (value) => {
		// 	if (value) {
		// 		maybeCreateOutlookBot();
		// 	}
		// });
	}),
);
