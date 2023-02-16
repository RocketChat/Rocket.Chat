import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { unmuteUserInRoom } from '../lib/unmuteUserInRoom';

Meteor.methods({
	unmuteUserInRoom(data) {
		const fromId = Meteor.userId();

		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		return Promise.await(unmuteUserInRoom(data.rid, fromId, data.username));
	},
});
