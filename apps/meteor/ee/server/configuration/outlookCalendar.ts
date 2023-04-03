import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../app/license/server';
import { addSettings } from '../settings/outlookCalendar';

Meteor.startup(() =>
	onLicense('outlook-calendar', () => {
		addSettings();
	}),
);
