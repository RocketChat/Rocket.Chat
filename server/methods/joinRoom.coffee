Meteor.methods
	joinRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'joinRoom' }

		room = RocketChat.models.Rooms.findOneById rid

		if not room?
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'joinRoom' }

		if room.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'joinRoom' }

		now = new Date()

		# Check if user is already in room
		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, Meteor.userId()
		if subscription?
			return

		user = RocketChat.models.Users.findOneById Meteor.userId()

		RocketChat.callbacks.run 'beforeJoinRoom', user, room

		# Automatically mute users in read only rooms
		if room.ro
			RocketChat.models.Rooms.addUsernameByIdAndMute rid, user.username
		else
			RocketChat.models.Rooms.addUsernameById rid, user.username

		RocketChat.models.Subscriptions.createWithRoomAndUser room, user,
			ts: now
			open: true
			alert: true
			unread: 1

		# Don't post message in read only rooms
		if not room.ro
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser rid, user,
				ts: now

		Meteor.defer ->
			RocketChat.callbacks.run 'afterJoinRoom', user, room

		return true
