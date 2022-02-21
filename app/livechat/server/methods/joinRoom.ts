import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../../authorization/server';
import { LivechatRooms } from '../../../models/server';
import { addUserToRoom } from '../../../lib/server/functions';

Meteor.methods({
	'livechat:joinRoom'(rid) {
		check(rid, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = LivechatRooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		return addUserToRoom(rid, user);
	},
});
