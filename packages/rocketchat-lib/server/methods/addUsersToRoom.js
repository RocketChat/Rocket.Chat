Meteor.methods({
	addUsersToRoom(data = {}) {
		// Validate user and room
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUsersToRoom'
			});
		}

		if (!Match.test(data.rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addUsersToRoom'
			});
		}

		// Get user and room details
		const room = RocketChat.models.Rooms.findOneById(data.rid);
		const userId = Meteor.userId();
		const user = Meteor.user();
		const userInRoom = Array.isArray(room.usernames) && room.usernames.includes(user.username);

		// Can't add to direct room ever
		if (room.t === 'd') {
			throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
				method: 'addUsersToRoom'
			});
		}

		// Can add to any room you're in, with permission, otherwise need specific room type permission
		let canAddUser = false;
		if (userInRoom && RocketChat.authz.hasPermission(userId, 'add-user-to-joined-room', room._id)) {
			canAddUser = true;
		} else if (room.t === 'c' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-c-room')) {
			canAddUser = true;
		} else if (room.t === 'p' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-p-room')) {
			canAddUser = true;
		}

		// Adding wasn't allowed
		if (!canAddUser) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addUsersToRoom'
			});
		}

		// Missing the users to be added
		if (!Array.isArray(data.users)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'addUsersToRoom'
			});
		}

		// Validate each user, then add to room
		data.users.forEach((username) => {
			const newUser = RocketChat.models.Users.findOneByUsername(username);
			if (!newUser) {
				throw new Meteor.Error('error-invalid-username', 'Invalid username', {
					method: 'addUsersToRoom'
				});
			}

			RocketChat.addUserToRoom(data.rid, newUser, user);
		});

		return true;
	}
});
