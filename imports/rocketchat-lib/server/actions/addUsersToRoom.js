import { Meteor } from 'meteor/meteor';

export default {
	addUsersToRoom: {
		async handler(ctx) {
			const { uid, rid, users } = ctx.params;
			// Get user and room details
			const room = RocketChat.models.Rooms.findOneById(rid);
			const userId = uid;
			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId, { fields: { _id: 1 } });
			const userInRoom = subscription != null;

			// Can't add to direct room ever
			if (room.t === 'd') {
				throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
					method: 'addUsersToRoom',
				});
			}

			// Can add to any room you're in, with permission, otherwise need specific room type permission
			let canAddUser = false;
			if (userInRoom && await RocketChat.call('authorization.hasPermission', { uid, permission: 'add-user-to-joined-room', scope: room._id })) {
				canAddUser = true;
			} else if (room.t === 'c' && await RocketChat.call('authorization.hasPermission', { uid, permission: 'add-user-to-any-c-room' })) {
				canAddUser = true;
			} else if (room.t === 'p' && await RocketChat.call('authorization.hasPermission', { uid, permission: 'add-user-to-any-p-room' })) {
				canAddUser = true;
			}

			// Adding wasn't allowed
			if (!canAddUser) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {
					method: 'addUsersToRoom',
				});
			}

			// Missing the users to be added
			if (!Array.isArray(users)) {
				throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
					method: 'addUsersToRoom',
				});
			}

			// Validate each user, then add to room
			const user = RocketChat.models.Users.findOneById(uid);
			users.forEach((username) => {
				const newUser = RocketChat.models.Users.findOneByUsername(username);
				if (!newUser) {
					throw new Meteor.Error('error-invalid-username', 'Invalid username', {
						method: 'addUsersToRoom',
					});
				}
				RocketChat.addUserToRoom(rid, newUser, user);
			});

			return true;
		},
	},
};
