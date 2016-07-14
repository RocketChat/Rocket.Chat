Meteor.methods
	removeUserFromRoom: (data) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'removeUserFromRoom' }

		fromId = Meteor.userId()
		check(data, Match.ObjectIncluding({ rid: String, username: String }))
		existingsAdmins = Meteor.users.find( { roles: { $in: ['admin'] } } ).fetch();

		unless RocketChat.authz.hasPermission(fromId, 'remove-user', data.rid)
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'removeUserFromRoom' }

		room = RocketChat.models.Rooms.findOneById data.rid

		if data.username not in (room?.usernames or [])
			throw new Meteor.Error 'error-user-not-in-room', 'User is not in this room', { method: 'removeUserFromRoom' }

		if existingsAdmins and _.isEqual(existingsAdmins.length, 1)
			throw new Meteor.Error 'error-action-not-allowed', 'Leaving the app with not admins is not allowed', { method: 'removeUserFromRoom', action: 'Leaving the app with not admins' }

		removedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.removeUsernameById data.rid, data.username

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId data.rid, removedUser._id

		if room.t in [ 'c', 'p' ]
			RocketChat.authz.removeUserFromRoles(removedUser._id, ['moderator', 'owner'], data.rid)

		fromUser = RocketChat.models.Users.findOneById fromId
		RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser data.rid, removedUser,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
