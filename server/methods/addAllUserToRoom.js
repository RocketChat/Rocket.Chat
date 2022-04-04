import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization/server';
import { Users, Rooms, Subscriptions, Messages } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { callbacks } from '../../lib/callbacks';

Meteor.methods({
	addAllUserToRoom(rid, activeUsersOnly = false) {
		check(rid, String);
		check(activeUsersOnly, Boolean);

		if (!hasPermission(this.userId, 'add-all-to-room')) {
			throw new Meteor.Error(403, 'Access to Method Forbidden', {
				method: 'addAllToRoom',
			});
		}

		const userFilter = {};
		if (activeUsersOnly === true) {
			userFilter.active = true;
		}

		const userCursor = Users.find(userFilter);
		const usersCount = userCursor.count();
		if (usersCount > settings.get('API_User_Limit')) {
			throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
				method: 'addAllToRoom',
			});
		}

		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addAllToRoom',
			});
		}

		const users = userCursor.fetch();
		const now = new Date();
		users.forEach(function (user) {
			const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
			if (subscription != null) {
				return;
			}
			callbacks.run('beforeJoinRoom', user, room);
			Subscriptions.createWithRoomAndUser(room, user, {
				ts: now,
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
			});
			Messages.createUserJoinWithRoomIdAndUser(rid, user, {
				ts: now,
			});
			Meteor.defer(function () {});
			return callbacks.run('afterJoinRoom', user, room);
		});
		return true;
	},
});
