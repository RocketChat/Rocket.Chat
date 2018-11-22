import { Meteor } from 'meteor/meteor';

export default {
	canAccessRoom: {
		cache: {
			keys: ['rid', 'uid', 'extraData'],
			ttl: 5,
		},
		params: {
			rid: 'string',
			uid: 'string',
			// visitorToken: 'string',
		},
		async handler(ctx) {
			const { params: { rid, uid, extraData } } = ctx;

			let user;

			if (uid) {
				user = RocketChat.models.Users.findOneById(uid, {
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

			const room = RocketChat.models.Rooms.findOneById(rid);
			if (room) {
				if (RocketChat.authz.canAccessRoom.call(this, room, user, extraData)) {
					if (user) {
						room.username = user.username;
					}
					return room;
				}

				if (!uid && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
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
	},
};
