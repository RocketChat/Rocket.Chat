import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Users, Rooms } from '../../app/models';
import { canAccessRoom } from '../../app/authorization';
import { settings } from '../../app/settings';

Meteor.methods({
	canAccessRoom(rid, userId, extraData) {
		check(rid, String);
		check(userId, Match.Maybe(String));

		let user;

		if (userId) {
			user = Users.findOneById(userId, {
				fields: {
					username: 1,
				},
			});

			if (!user || !user.username) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoom',
				});
			}
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom',
			});
		}

		const room = Rooms.findOneById(rid);
		if (room) {
			if (canAccessRoom.call(this, room, user, extraData)) {
				if (user) {
					room.username = user.username;
				}
				return room;
			}

			if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoom',
				});
			}

			return false;
		} else {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom',
			});
		}
	},
});
