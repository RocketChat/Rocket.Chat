import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	ignoreUser({ rid, userId: ignoredUser, ignore = true }) {
		check(ignoredUser, String);
		check(rid, String);
		check(ignore, Boolean);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'ignoreUser',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'ignoreUser',
			});
		}

		const subscriptionIgnoredUser = Subscriptions.findOneByRoomIdAndUserId(rid, ignoredUser);

		if (!subscriptionIgnoredUser) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'ignoreUser',
			});
		}

		return !!Subscriptions.ignoreUser({ _id: subscription._id, ignoredUser, ignore });
	},
});
