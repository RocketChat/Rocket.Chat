import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { markRoomAsRead } from '../lib/markRoomAsRead';
import { canAccessRoom } from '../../app/authorization/server';
import { Rooms } from '../../app/models/server';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		const user = Meteor.user();
		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-room-does-not-exist', 'This room does not exist', { method: 'readMessages' });
		}
		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readMessages' });
		}

		markRoomAsRead(rid, userId);
	},
});
