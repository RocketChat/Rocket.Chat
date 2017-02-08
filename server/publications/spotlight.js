Meteor.methods({
	spotlight: function(text, usernames, type = {users: true, rooms: true}) {
		const result = {
			users: [],
			rooms: []
		};

		if (this.userId == null) {
			return result;
		}

		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (type.users === true && RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
			result.users = RocketChat.models.Users.findByActiveUsersUsernameExcept(text, usernames, {
				limit: 5,
				fields: {
					username: 1,
					status: 1
				},
				sort: {
					username: 1
				}
			}).fetch();
		}

		if (type.rooms === true && RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
			const username = RocketChat.models.Users.findOneById(this.userId, {
				username: 1
			}).username;

			result.rooms = RocketChat.models.Rooms.findByNameAndTypeNotContainingUsername(regex, 'c', username, {
				limit: 5,
				fields: {
					t: 1,
					name: 1
				},
				sort: {
					name: 1
				}
			}).fetch();
		}
		return result;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/*userId*/) {
		return true;
	}
}, 100, 100000);
