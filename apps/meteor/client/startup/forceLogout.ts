import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { sdk } from '../../app/utils/client/lib/SDKClient';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userId = Meteor.userId();

		if (!userId) {
			return;
		}
		Session.set('force_logout', false);
		sdk.stream('notify-user', [`${userId}/force_logout`], () => {
			Session.set('force_logout', true);
		});
	});
});
