import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { Rooms } from '../../../models/server';
import { unarchiveRoom } from '../functions';

Meteor.methods({
	unarchiveRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unarchiveRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'unarchiveRoom' });
		}

		if (!hasPermission(Meteor.userId(), 'unarchive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'unarchiveRoom' });
		}

		return unarchiveRoom(rid);
	},
});
