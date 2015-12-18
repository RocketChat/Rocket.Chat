Meteor.methods
	joinDefaultChannels: ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] joinDefaultChannels -> Invalid user")

		user = Meteor.user()

		RocketChat.callbacks.run 'beforeJoinDefaultChannels', user

		RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c', 'p']).forEach (room) ->

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
				RocketChat.models.Messages.createUserJoinWithRoomIdAndUser room._id, user
