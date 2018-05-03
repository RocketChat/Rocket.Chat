import _ from 'underscore';

RocketChat.Migrations.add({
	version: 19,
	up() {
		/*
		 * Migrate existing admin users to Role based admin functionality
		 * 'admin' role applies to global scope
		 */

		const admins = Meteor.users.find({
			admin: true
		}, {
			fields: {
				_id: 1,
				username: 1
			}
		}).fetch();

		admins.forEach((admin) => {
			RocketChat.authz.addUserRoles(admin._id, ['admin']);
		});

		Meteor.users.update({}, {
			$unset: {
				admin: ''
			}
		}, {
			multi: true
		});

		let usernames = _.pluck(admins, 'username').join(', ');

		console.log((`Migrate ${ usernames } from admin field to 'admin' role`).green);

		// Add 'user' role to all users
		const users = Meteor.users.find().fetch();
		users.forEach((user) => {
			RocketChat.authz.addUserRoles(user._id, ['user']);
		});

		usernames = _.pluck(users, 'username').join(', ');
		console.log((`Add ${ usernames } to 'user' role`).green);

		// Add 'moderator' role to channel/group creators
		const rooms = RocketChat.models.Rooms.findByTypes(['c', 'p']).fetch();
		return rooms.forEach((room) => {
			const creator = room && room.u && room.u._id;

			if (creator) {
				if (Meteor.users.findOne({
					_id: creator
				})) {
					return RocketChat.authz.addUserRoles(creator, ['moderator'], room._id);
				} else {
					RocketChat.models.Subscriptions.removeByRoomId(room._id);
					RocketChat.models.Messages.removeByRoomId(room._id);
					return RocketChat.models.Rooms.removeById(room._id);
				}
			}
		});
	}
});
