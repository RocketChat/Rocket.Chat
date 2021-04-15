import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { PushNotificationSubscriptions } from '../../../models';

Meteor.methods({
	removeUserFromPushSubscription(endpoint) {
		check(endpoint, String);

		PushNotificationSubscriptions.updateUserIdWithSubscriptionEndpoint(endpoint);

		return endpoint;
	},
});
