Meteor.methods
	unArchiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] unArchiveRoom -> Invalid user'

		console.log '[methods] unArchiveRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		room = ChatRoom.findOne rid

		if room.u? and room.u._id is Meteor.userId() or Meteor.user().admin?
			update =
				$set:
					archived: false

			ChatRoom.update rid, update

			for username in room.usernames
				member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
				if not member?
					continue

				RocketChat.models.Subscriptions.unarchiveByRoomIdAndUserId rid, member._id
