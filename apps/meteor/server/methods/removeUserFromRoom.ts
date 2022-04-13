import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission, hasRole, getUsersInRole } from '../../app/authorization/server';
import { removeUserFromRolesAsync } from '../lib/roles/removeUserFromRoles';
import { Users, Subscriptions, Rooms, Messages } from '../../app/models/server';
import { callbacks } from '../../lib/callbacks';
import { Team } from '../sdk';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

Meteor.methods({
	async removeUserFromRoom(data) {
		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeUserFromRoom',
			});
		}

		if (!hasPermission(fromId, 'remove-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom',
			});
		}

		const room = Rooms.findOneById(data.rid);

		if (!room || !roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.REMOVE_USER)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom',
			});
		}

		const removedUser = Users.findOneByUsernameIgnoringCase(data.username);

		const fromUser = Users.findOneById(fromId);

		const subscription = Subscriptions.findOneByRoomIdAndUserId(data.rid, removedUser._id, {
			fields: { _id: 1 },
		});
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeUserFromRoom',
			});
		}

		if (hasRole(removedUser._id, 'owner', room._id)) {
			const numOwners = await (await getUsersInRole('owner', room._id)).count();

			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
					method: 'removeUserFromRoom',
				});
			}
		}

		callbacks.run('beforeRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);

		Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);

		if (['c', 'p'].includes(room.t) === true) {
			await removeUserFromRolesAsync(removedUser._id, ['moderator', 'owner'], data.rid);
		}

		Messages.createUserRemovedWithRoomIdAndUser(data.rid, removedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		if (room.teamId && room.teamMain) {
			// if a user is kicked from the main team room, delete the team membership
			await Team.removeMember(room.teamId, removedUser._id);
		}

		Meteor.defer(function () {
			callbacks.run('afterRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);
		});

		return true;
	},
});
