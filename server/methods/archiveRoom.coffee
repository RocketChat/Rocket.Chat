Meteor.methods
	archiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] archiveRoom -> Invalid user'

		room = RocketChat.models.Rooms.findOneById rid

		unless room
			throw new Meteor.Error 'invalid-room', '[methods] unarchiveRoom -> Invalid room'

		if room.u? and room.u._id is Meteor.userId() or RocketChat.authz.hasRole(Meteor.userId(), 'admin')
			RocketChat.models.Rooms.archiveById rid

			for username in room.usernames
				member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
				if not member?
					continue

				RocketChat.models.Subscriptions.archiveByRoomIdAndUserId rid, member._id
