import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { userStatuses } from '../lib/userStatuses';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		void sdk.call('listCustomUserStatus').then((result) => {
			if (!result) {
				return;
			}

			for (const customStatus of result) {
				userStatuses.put(userStatuses.createFromCustom(customStatus));
			}
		});
	});
});
