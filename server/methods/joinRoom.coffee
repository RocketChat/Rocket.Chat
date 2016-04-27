Meteor.methods
	joinRoom: (rid) ->

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

		RocketChat.models.Rooms.addUsernameById rid, user.username

		RocketChat.models.Subscriptions.createWithRoomAndUser room, user,
			ts: now
			open: true
			alert: true
			unread: 1

		RocketChat.models.Messages.createUserJoinWithRoomIdAndUser rid, user,
			ts: now

		Meteor.defer ->
			RocketChat.callbacks.run 'afterJoinRoom', user, room

		return true
