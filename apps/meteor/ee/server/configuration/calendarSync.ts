import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { configureCalendarSync, createPermissions } from '../lib/calendarSync/startup';
import { addSettings } from '../settings/calendarSync';

Meteor.startup(() =>
	License.onLicense('outlook-calendar', async () => {
		addSettings();
		await createPermissions();
		await configureCalendarSync();
	}),
);
