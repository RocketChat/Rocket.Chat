Meteor.methods
	leaveRoom: (rid) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] leaveRoom -> Invalid user")

		this.unblock()

		fromId = Meteor.userId()
		room = RocketChat.models.Rooms.findOneById rid
		user = Meteor.user()

		RocketChat.callbacks.run 'beforeLeaveRoom', user, room

		RocketChat.models.Rooms.removeUsernameById rid, user.username

		if room.t isnt 'c' and room.usernames.indexOf(user.username) isnt -1
			removedUser = user

			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser rid, removedUser

		if room.t is 'l'
			RocketChat.models.Messages.createCommandWithRoomIdAndUser 'survey', rid, user


		if room.u?._id is Meteor.userId()
			newOwner = _.without(room.usernames, user.username)[0]
			if newOwner?
				newOwner = RocketChat.models.Users.findOneByUsername newOwner

				if newOwner?
					RocketChat.models.Rooms.setUserById rid, newOwner

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId rid, Meteor.userId()

		Meteor.defer ->

			RocketChat.callbacks.run 'afterLeaveRoom', user, room
