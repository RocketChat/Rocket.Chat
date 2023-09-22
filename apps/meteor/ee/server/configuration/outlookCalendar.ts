import { Calendar } from '@rocket.chat/core-services';
import * as License from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { addSettings } from '../settings/outlookCalendar';

Meteor.startup(() =>
	License.onLicense('outlook-calendar', async () => {
		addSettings();

		await Calendar.setupNextNotification();
	}),
);
