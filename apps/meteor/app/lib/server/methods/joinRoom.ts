import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission, canAccessRoom } from '../../../authorization/server';
import { Rooms } from '../../../models/server';
import { addUserToRoom } from '../functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

Meteor.methods({
	joinRoom(rid, code) {
		check(rid, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.JOIN)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}
		if (room.joinCodeRequired === true && code !== room.joinCode && !hasPermission(user._id, 'join-without-join-code')) {
			throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', {
				method: 'joinRoom',
			});
		}

		return addUserToRoom(rid, user);
	},
});
