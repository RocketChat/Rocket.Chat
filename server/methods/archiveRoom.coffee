Meteor.methods
	archiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] archiveRoom -> Invalid user'

		console.log '[methods] archiveRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		room = RocketChat.models.Rooms.findOneById rid

		if room.u? and room.u._id is Meteor.userId() or Meteor.user().admin?
			update =
				$set:
					archived: true

			ChatRoom.update rid, update

			for username in room.usernames
				member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
				if not member?
					continue

				RocketChat.models.Subscriptions.archiveByRoomIdAndUserId rid, member._id
