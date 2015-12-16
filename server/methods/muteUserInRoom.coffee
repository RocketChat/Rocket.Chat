Meteor.methods
	muteUserInRoom: (data) ->
		fromId = Meteor.userId()
		console.log '[methods] muteUserInRoom -> '.green, 'fromId:', fromId, 'data:', data

		check(data, Match.ObjectIncluding({ rid: String, username: String }))

		unless RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)
			throw new Meteor.Error 'not-allowed', 'Not allowed'

		room = RocketChat.models.Rooms.findOneById data.rid

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'not-in-room', 'User is not in this room'

		mutedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Subscriptions.muteUserByRoomIdAndUserId data.rid, mutedUser._id

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserMutedWithRoomIdAndUser data.rid, mutedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
