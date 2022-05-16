import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms, Subscriptions } from '../../../models/server';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

Meteor.methods({
	blockUser({ rid, blocked }) {
		check(rid, String);
		check(blocked, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const room = Rooms.findOne({ _id: rid });

		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.BLOCK)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		const subscription2 = Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		Subscriptions.setBlockedByRoomId(rid, blocked, Meteor.userId());

		return true;
	},
});
