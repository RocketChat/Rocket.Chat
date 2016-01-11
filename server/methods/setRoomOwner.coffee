Meteor.methods
	setRoomOwner: (rid, userId) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] setRoomOwner -> Invalid user'

		check rid, String
		check userId, String

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'set-owner', rid) or ChatRoom.findOne(rid)?.u?._id is Meteor.userId()
			throw new Meteor.Error 403, 'Not allowed'

		room = RocketChat.models.Rooms.findOne(rid)
		if room?.u?._id is userId
			throw new Meteor.Error 'user-is-owner', '[methods] setRoomOwner -> User is already the owner of this room'

		user = RocketChat.models.Users.findOneById userId
		if RocketChat.models.Rooms.setUserById rid, user
			fromUser = RocketChat.models.Users.findOneById Meteor.userId()
			RocketChat.models.Messages.createSetOwnerWithRoomIdAndUser rid, user,
				u:
					_id: fromUser._id
					username: fromUser.username

			return true
