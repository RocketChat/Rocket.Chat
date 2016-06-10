Meteor.methods
	addUserToRoom: (data) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addUserToRoom' }

		fromId = Meteor.userId()
		unless Match.test data?.rid, String
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'addUserToRoom' }

		unless Match.test data?.username, String
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addUserToRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid

		if room.usernames.indexOf(Meteor.user().username) is -1
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		# if room.username isnt Meteor.user().username and room.t is 'c'
		if not RocketChat.authz.hasPermission(fromId, 'add-user-to-room', room._id)
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addUserToRoom' }

		if room.t is 'd'
			throw new Meteor.Error 'error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', { method: 'addUserToRoom' }

		# verify if user is already in room
		if room.usernames.indexOf(data.username) isnt -1
			return

		newUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.addUsernameById data.rid, data.username

		now = new Date()

		RocketChat.models.Subscriptions.createWithRoomAndUser room, newUser,
			ts: now
			open: true
			alert: true
			unread: 1

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserAddedWithRoomIdAndUser data.rid, newUser,
			ts: now
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
