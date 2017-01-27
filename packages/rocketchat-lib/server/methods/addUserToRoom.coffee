Meteor.methods
	addUserToRoom: (data) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addUserToRoom' }

		unless Match.test data?.rid, String
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'addUserToRoom' }

		unless Match.test data?.username, String
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addUserToRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid
		userId = Meteor.userId()
		user = Meteor.user()
		userInRoom = room.usernames?.indexOf(Meteor.user().username) >= 0
		canAddToOwnRoom = RocketChat.authz.hasPermission userId, 'add-user-to-own-room', room._id
		canAddToAnyRoom = RocketChat.authz.hasPermission userId, 'add-user-to-any-room'
		newUser = RocketChat.models.Users.findOneByUsername data.username

		if room.t is 'd'
			throw new Meteor.Error 'error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', { method: 'addUserToRoom' }

		# Can't add to private room if you're not a member
		if room.t is 'p' and not userInRoom
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		# Can't add to channels if you're not a member (without higher permissions)
		if room.t is 'c' and not userInRoom and not canAddToAnyRoom
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		# Can't add to channels if you're a member without permission
		if room.t is 'c' and userInRoom and not canAddToOwnRoom
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		if not newUser?._id?
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addUserToRoom' }

		RocketChat.addUserToRoom(data.rid, newUser, user);

		return true
