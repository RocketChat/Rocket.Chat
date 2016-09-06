Meteor.methods
	unmuteUserInRoom: (data) ->
		fromId = Meteor.userId()
		check(data, Match.ObjectIncluding({ rid: String, username: String }))

		unless RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'unmuteUserInRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid
		if not room
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'unmuteUserInRoom' }

		if room.t not in ['c', 'p']
			throw new Meteor.Error 'error-invalid-room-type', room.t + ' is not a valid room type', { method: 'unmuteUserInRoom', type: room.t }

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'error-user-not-in-room', 'User is not in this room', { method: 'unmuteUserInRoom' }

		unmutedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.unmuteUsernameByRoomId data.rid, unmutedUser.username

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserUnmutedWithRoomIdAndUser data.rid, unmutedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
