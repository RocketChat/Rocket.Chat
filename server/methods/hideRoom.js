import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	hideRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return Subscriptions.hideByRoomIdAndUserId(rid, Meteor.userId());
	},
});
