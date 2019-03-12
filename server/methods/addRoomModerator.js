import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Users, Subscriptions, Messages, Rooms, Permissions } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.methods({
	addRoomModerator(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		if (!hasPermission(Meteor.userId(), 'set-moderator', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomModerator',
			});
		}

		const user = Users.findOneById(userId);

		const room = Rooms.findOneById(rid);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomModerator',
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('moderator') === true) {
			throw new Meteor.Error('error-user-already-moderator', 'User is already a moderator', {
				method: 'addRoomModerator',
			});
		}

		Subscriptions.addRoleById(subscription._id, 'moderator');

		if (room && (room.ro || room.broadcast)) {
			const permission = Permissions.findOneById('post-readonly');
			if (permission.roles.includes('moderator')===true) {
				Rooms.unmuteUsernameByRoomId(rid, user.username);
			}
		}

		const fromUser = Users.findOneById(Meteor.userId());

		Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'moderator',
		});

		if (settings.get('UI_DisplayRoles')) {
			Notifications.notifyLogged('roles-change', {
				type: 'added',
				_id: 'moderator',
				u: {
					_id: user._id,
					username: user.username,
					name: fromUser.name,
				},
				scope: rid,
			});
		}

		return true;
	},
});
