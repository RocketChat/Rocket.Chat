Meteor.methods
	joinRoom: (rid) ->

		room = RocketChat.models.Rooms.findOneById rid

		console.log '[methods] joinRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if not room?
			throw new Meteor.Error 500, 'No channel with this id'

		if room.t isnt 'c'
			throw new Meteor.Error 403, '[methods] joinRoom -> Not allowed'

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
