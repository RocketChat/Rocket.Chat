Meteor.methods
	getRoomIdByNameOrId: (rid) ->

		room = RocketChat.models.Rooms.findOneById(rid) or RocketChat.models.Rooms.findOneByName(rid)

		if room?.t isnt 'c' or RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'joinRoom' }

		return room._id
