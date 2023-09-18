import { Calendar } from '@rocket.chat/core-services';
import { onLicense } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { addSettings } from '../settings/outlookCalendar';

Meteor.startup(() =>
	onLicense('outlook-calendar', async () => {
		addSettings();

		await Calendar.setupNextNotification();
	}),
);
