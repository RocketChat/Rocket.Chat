Meteor.methods
	leaveRoom: (rid) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] leaveRoom -> Invalid user")

		this.unblock()

		fromId = Meteor.userId()
		room = RocketChat.models.Rooms.findOneById rid
		user = Meteor.user()

		# If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.
		if RocketChat.authz.hasRole(user._id, 'owner', room._id)
			numOwners = RocketChat.authz.getUsersInRole('owner', room._id).fetch().length
			if numOwners is 1
				throw new Meteor.Error 'last-owner', '[methods] leaveRoom -> User is last owner in room.'

		RocketChat.callbacks.run 'beforeLeaveRoom', user, room

		RocketChat.models.Rooms.removeUsernameById rid, user.username

		if room.usernames.indexOf(user.username) isnt -1
			removedUser = user
			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser rid, removedUser

		if room.t is 'l'
			RocketChat.models.Messages.createCommandWithRoomIdAndUser 'survey', rid, user

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId rid, Meteor.userId()

		Meteor.defer ->

			RocketChat.callbacks.run 'afterLeaveRoom', user, room
