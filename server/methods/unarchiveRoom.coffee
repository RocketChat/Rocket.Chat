Meteor.methods
	unarchiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] unarchiveRoom -> Invalid user'

		room = RocketChat.models.Rooms.findOneById rid

		unless room
			throw new Meteor.Error 'invalid-room', '[methods] unarchiveRoom -> Invalid room'

		if RocketChat.authz.hasPermission(Meteor.userId(), 'unarchive-room', room._id)
			RocketChat.models.Rooms.unarchiveById rid

			for username in room.usernames
				member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
				if not member?
					continue

				RocketChat.models.Subscriptions.unarchiveByRoomIdAndUserId rid, member._id
