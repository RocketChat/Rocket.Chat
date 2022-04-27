import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Subscriptions } from '../../app/models/server';

Meteor.methods({
	hideRoom(rid, keep) {
		check(rid, String);
		check(keep, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return Subscriptions.hideByRoomIdAndUserId(rid, Meteor.userId(), keep);
	},
});
