import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	openRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom',
			});
		}

		return Subscriptions.openByRoomIdAndUserId(rid, Meteor.userId());
	},
});
