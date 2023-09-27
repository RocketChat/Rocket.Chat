import { Calendar } from '@rocket.chat/core-services';
import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../app/license/server';
import { addSettings } from '../settings/outlookCalendar';

Meteor.startup(() =>
	onLicense('outlook-calendar', async () => {
		addSettings();

		await Calendar.setupNextNotification();
	}),
);
