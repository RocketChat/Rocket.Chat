Meteor.methods({
	spotlight(text, usernames, type = {users: true, rooms: true}) {
		const result = {
			users: [],
			rooms: []
		};

		const roomOptions = {
			limit: 5,
			fields: {
				t: 1,
				name: 1
			},
			sort: {
				name: 1
			}
		};

		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (this.userId == null) {
			if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				result.rooms = RocketChat.models.Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch();
			}
			return result;
		}

		if (type.users === true && RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
			const userOptions = {
				limit: 5,
				fields: {
					username: 1,
					name: 1,
					status: 1
				},
				sort: {}
			};

			if (RocketChat.settings.get('UI_Use_Real_Name')) {
				userOptions.sort.name = 1;
			} else {
				userOptions.sort.username = 1;
			}

			result.users = RocketChat.models.Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
		}

		if (type.rooms === true && RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
			const username = RocketChat.models.Users.findOneById(this.userId, {
				username: 1
			}).username;

			result.rooms = RocketChat.models.Rooms.findByNameAndTypeNotContainingUsername(regex, 'c', username, roomOptions).fetch();
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
