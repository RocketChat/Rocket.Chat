Meteor.methods
	muteUserInRoom: (data) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'muteUserInRoom' }

		fromId = Meteor.userId()
		check(data, Match.ObjectIncluding({ rid: String, username: String }))

		unless RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'muteUserInRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid
		if not room
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'muteUserInRoom' }

		if room.t not in ['c', 'p']
			throw new Meteor.Error 'error-invalid-room-type', room.t + ' is not a valid room type', { method: 'muteUserInRoom', type: room.t }

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'error-user-not-in-room', 'User is not in this room', { method: 'muteUserInRoom' }

		mutedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.muteUsernameByRoomId data.rid, mutedUser.username

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserMutedWithRoomIdAndUser data.rid, mutedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
