import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms, Subscriptions, Users, Messages } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { callbacks } from '../../lib/callbacks';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

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

		const fromId = Meteor.userId();

		if (!hasPermission(fromId, 'mute-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'muteUserInRoom',
			});
		}

		const room = Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'muteUserInRoom',
			});
		}

		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.MUTE)) {
			throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
				method: 'muteUserInRoom',
				type: room.t,
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUsername(data.rid, data.username, {
			fields: { _id: 1 },
		});
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'muteUserInRoom',
			});
		}

		const mutedUser = Users.findOneByUsernameIgnoringCase(data.username);

		const fromUser = Users.findOneById(fromId);

		callbacks.run('beforeMuteUser', { mutedUser, fromUser }, room);

		Rooms.muteUsernameByRoomId(data.rid, mutedUser.username);

		Messages.createUserMutedWithRoomIdAndUser(data.rid, mutedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		callbacks.run('afterMuteUser', { mutedUser, fromUser }, room);

		return true;
	},
});
