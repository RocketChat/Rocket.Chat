import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { PushNotificationSubscriptions } from '../../../models';

Meteor.methods({
	savePushNotificationSubscription(subscription, platform) {
		subscription = JSON.parse(subscription);

		check(subscription.endpoint, String);

		let user = Meteor.user();
		if (user) {
			user = {
				_id: user._id,
				username: user.username,
			};
		}
		PushNotificationSubscriptions.createWithUserAndSubscription(user, subscription, platform);

		return subscription;
	},
});
