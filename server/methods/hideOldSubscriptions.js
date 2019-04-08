import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Subscriptions } from 'meteor/rocketchat:models';

const DURATION_WEEK = 1000 * 60 * 60 * 24 * 7;

Meteor.methods({
	hideOldSubscriptions(userId = Meteor.userId(), idleDuration = DURATION_WEEK) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideOldSubscriptions',
			});
		}

		if (!Match.test(idleDuration, Number)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'hideOldSubscriptions',
			});
		}

		const thresholdDate = new Date(new Date() - idleDuration);

		return Subscriptions.hideOldByUserId(userId, thresholdDate);
	},
});
