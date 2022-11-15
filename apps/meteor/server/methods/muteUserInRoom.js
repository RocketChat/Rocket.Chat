import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { muteUserInRoom } from '../lib/muteUserInRoom';

Meteor.methods({
	muteUserInRoom(data) {
		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom',
			});
		}

		return Promise.await(muteUserInRoom(data.rid, Meteor.userId(), data.username));
	},
});
