import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userId = Meteor.userId();

		if (!userId) {
			return;
		}
		Session.set('force_logout', false);
		Notifications.onUser('force_logout', () => {
			Session.set('force_logout', true);
		});
	});
});
