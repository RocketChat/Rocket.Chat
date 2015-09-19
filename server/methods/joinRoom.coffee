Meteor.methods
	joinRoom: (rid) ->

		room = RocketChat.models.Rooms.findOneById rid

		if room.t isnt 'c'
			throw new Meteor.Error 403, '[methods] joinRoom -> Not allowed'

		# verify if user is already in room
		# if room.usernames.indexOf(user.username) is -1
		console.log '[methods] joinRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		now = new Date()

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
