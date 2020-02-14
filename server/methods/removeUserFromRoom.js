import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission, hasRole, getUsersInRole, removeUserFromRoles } from '../../app/authorization';
import { Users, Subscriptions, Rooms, Messages } from '../../app/models';
import { callbacks } from '../../app/callbacks';

Meteor.methods({
	removeUserFromRoom(data) {
		check(data, Match.ObjectIncluding({
			rid: String,
			username: String,
		}));

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

		if (!room || room.t === 'd') {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom',
			});
		}

		const removedUser = Users.findOneByUsernameIgnoringCase(data.username);

		const fromUser = Users.findOneById(fromId);

		const subscription = Subscriptions.findOneByRoomIdAndUserId(data.rid, removedUser._id, { fields: { _id: 1 } });
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeUserFromRoom',
			});
		}

		if (hasRole(removedUser._id, 'owner', room._id)) {
			const numOwners = getUsersInRole('owner', room._id).fetch().length;

			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
					method: 'removeUserFromRoom',
				});
			}
		}

		callbacks.run('beforeRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);

		Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);

		if (['c', 'p'].includes(room.t) === true) {
			removeUserFromRoles(removedUser._id, ['moderator', 'owner'], data.rid);
		}

		Messages.createUserRemovedWithRoomIdAndUser(data.rid, removedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		Meteor.defer(function() {
			callbacks.run('afterRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);
		});

		return true;
	},
});
