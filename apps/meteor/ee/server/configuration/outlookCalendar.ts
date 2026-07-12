import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { setupEnterpriseCalendar } from '../enterprise-calendar/runtime';
import { addSettings } from '../settings/outlookCalendar';
import '../enterprise-calendar/webhook';

Meteor.startup(() =>
	License.onLicense('outlook-calendar', async () => {
		addSettings();

		await Calendar.setupNextNotification();
		await Calendar.setupNextStatusChange();
		await setupEnterpriseCalendar();
	}),
);
