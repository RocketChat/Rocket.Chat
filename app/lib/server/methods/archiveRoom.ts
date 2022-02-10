import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';
import { archiveRoom } from '../functions';
import { roomTypes, RoomMemberActions } from '../../../utils/server';

Meteor.methods({
	archiveRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
		}

		if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE)) {
			throw new Meteor.Error('error-direct-message-room', `rooms type: ${room.t} can not be archived`, { method: 'archiveRoom' });
		}

		if (!hasPermission(Meteor.userId(), 'archive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
		}

		return archiveRoom(rid);
	},
});
