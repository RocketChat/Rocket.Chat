import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms, Users, Messages } from '../../../models';

Meteor.methods({
	getUserMentionsByChannel({ roomId, options }) {
		check(roomId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUserMentionsByChannel',
			});
		}

		const room = Rooms.findOneById(roomId);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'getUserMentionsByChannel',
			});
		}

		const user = Users.findOneById(Meteor.userId());

		return Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).fetch();
	},
});
