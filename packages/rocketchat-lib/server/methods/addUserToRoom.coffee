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
		userInRoom = room.usernames?.indexOf(user.username) >= 0
		newUser = RocketChat.models.Users.findOneByUsername data.username

		if not newUser?._id?
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addUserToRoom' }

		# Can't add to direct room ever
		if room.t is 'd'
			throw new Meteor.Error 'error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', { method: 'addUserToRoom' }

		# Can add to any room you're in, with permission - otherwise need specific permission
		if userInRoom and RocketChat.authz.hasPermission userId, 'add-user-to-joined-room', room._id
			canAddUser = true
		else if room.t is 'c' and RocketChat.authz.hasPermission userId, 'add-user-to-any-c-room'
			canAddUser = true
		else if room.t is 'p' and RocketChat.authz.hasPermission userId, 'add-user-to-any-p-room'
			canAddUser = true

		if canAddUser
			RocketChat.addUserToRoom(data.rid, newUser, user);
		else
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		return true
