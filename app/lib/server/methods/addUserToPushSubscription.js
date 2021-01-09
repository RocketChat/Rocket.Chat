import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { PushNotificationSubscriptions } from '../../../models';

Meteor.methods({
	addUserToPushSubscription(endpoint) {
		check(endpoint, String);

		let user = Meteor.user();
		if (user) {
			user = {
				_id: user._id,
				username: user.username,
			};
		}

		PushNotificationSubscriptions.updateUserIdWithSubscriptionEndpoint(endpoint, user);

		return endpoint;
	},
});
