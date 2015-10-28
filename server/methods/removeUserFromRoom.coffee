Meteor.methods
	removeUserFromRoom: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] removeUserFromRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = RocketChat.models.Rooms.findOneById data.rid

		if room.u?._id isnt Meteor.userId() and room.t is 'c'
			throw new Meteor.Error 403, 'Not allowed'

		removedUser = RocketChat.models.Users.findOneByUsername data.username

		RocketChat.models.Rooms.removeUsernameById data.rid, data.username

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId data.rid, data.username

		switch room.t
			when 'c'
				RocketChat.authz.removeUsersFromRole(removedUser._id; 'channel-moderator',  data.rid)
			when 'p'
				RocketChat.authz.removeUsersFromRole(removedUser._id; 'group-moderator',  data.rid)

		RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser data.rid, removedUser

		return true
