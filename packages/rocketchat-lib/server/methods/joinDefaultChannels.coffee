Meteor.methods
	joinDefaultChannels: (silenced) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] joinDefaultChannels -> Invalid user")

		this.unblock()

		user = Meteor.user()

		RocketChat.callbacks.run 'beforeJoinDefaultChannels', user

		defaultRooms = RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c', 'p'], {fields: {usernames: 0}}).fetch()

		defaultRooms.forEach (room) ->

			# put user in default rooms
			RocketChat.models.Rooms.addUsernameById room._id, user.username

			if not RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)?

				# Add a subscription to this user
				RocketChat.models.Subscriptions.createWithRoomAndUser room, user,
					ts: new Date()
					open: true
					alert: true
					unread: 1

				# Insert user joined message
				if not silenced
					RocketChat.models.Messages.createUserJoinWithRoomIdAndUser room._id, user
