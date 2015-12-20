Meteor.methods
	muteUserInRoom: (data) ->
		fromId = Meteor.userId()
		check(data, Match.ObjectIncluding({ rid: String, username: String }))

		unless RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)
			throw new Meteor.Error 'not-allowed', '[methods] muteUserInRoom -> Not allowed'

		room = RocketChat.models.Rooms.findOneById data.rid
		if not room
			throw new Meteor.Error 'invalid-room', '[methods] muteUserInRoom -> Room ID is invalid'

		if room.t not in ['c', 'p']
			throw new Meteor.Error 'invalid-room-type', '[methods] muteUserInRoom -> Invalid room type'

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'not-in-room', '[methods] muteUserInRoom -> User is not in this room'

		mutedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.muteUsernameByRoomId data.rid, mutedUser.username

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserMutedWithRoomIdAndUser data.rid, mutedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
