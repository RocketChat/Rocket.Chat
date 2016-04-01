Meteor.methods
	unarchiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user'

		room = RocketChat.models.Rooms.findOneById rid

		unless room
			throw new Meteor.Error 'error-invalid-room', 'Invalid room'

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'unarchive-room', room._id)
			throw new Meteor.Error 'error-not-authorized', 'Not authorized'

		RocketChat.models.Rooms.unarchiveById rid

		for username in room.usernames
			member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
			if not member?
				continue

			RocketChat.models.Subscriptions.unarchiveByRoomIdAndUserId rid, member._id
