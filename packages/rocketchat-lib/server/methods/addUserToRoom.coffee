Meteor.methods
	addUserToRoom: (data) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addUserToRoom' }

		unless Match.test data?.rid, String
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'addUserToRoom' }

		unless Match.test data?.username, String
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addUserToRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid

		if room.usernames.indexOf(Meteor.user().username) is -1
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		fromId = Meteor.userId()
		if not RocketChat.authz.hasPermission(fromId, 'add-user-to-room', room._id)
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		if room.t is 'd'
			throw new Meteor.Error 'error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', { method: 'addUserToRoom' }


		newUser = RocketChat.models.Users.findOneByUsername data.username
		RocketChat.addUserToRoom(data.rid, newUser, Meteor.user());

		return true
