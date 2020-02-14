import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasRole } from '../../app/authorization';
import { Users, Rooms, Subscriptions, Messages } from '../../app/models';
import { settings } from '../../app/settings';
import { callbacks } from '../../app/callbacks';

Meteor.methods({
	addAllUserToRoom(rid, activeUsersOnly = false) {
		check(rid, String);
		check(activeUsersOnly, Boolean);

		if (hasRole(this.userId, 'admin') === true) {
			const userCount = Users.find().count();
			if (userCount > settings.get('API_User_Limit')) {
				throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
					method: 'addAllToRoom',
				});
			}

			const room = Rooms.findOneById(rid);
			if (room == null) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', {
					method: 'addAllToRoom',
				});
			}

			const userFilter = {};
			if (activeUsersOnly === true) {
				userFilter.active = true;
			}

			const users = Users.find(userFilter).fetch();
			const now = new Date();
			users.forEach(function(user) {
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
				Meteor.defer(function() {});
				return callbacks.run('afterJoinRoom', user, room);
			});
			return true;
		}
		throw new Meteor.Error(403, 'Access to Method Forbidden', {
			method: 'addAllToRoom',
		});
	},
});
