Meteor.methods
	removeUserFromRoom: (data) ->
		fromId = Meteor.userId()
		check(data, Match.ObjectIncluding({ rid: String, username: String }))

		unless RocketChat.authz.hasPermission(fromId, 'remove-user', data.rid)
			throw new Meteor.Error 'not-allowed', 'Not allowed'

		room = RocketChat.models.Rooms.findOneById data.rid

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'not-in-room', 'User is not in this room'

		removedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.removeUsernameById data.rid, data.username

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId data.rid, removedUser._id

		if room.t in [ 'c', 'p' ]
			RocketChat.authz.removeUserFromRoles(removedUser._id; 'moderator', data.rid)

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser data.rid, removedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
