Meteor.methods
	getRoomIdByNameOrId: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getRoomIdByNameOrId' }

		room = RocketChat.models.Rooms.findOneById(rid) or RocketChat.models.Rooms.findOneByName(rid)

		if room.usernames.indexOf(Meteor.user()?.username) isnt -1
			return room._id

		if room?.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'getRoomIdByNameOrId' }

		return room._id
