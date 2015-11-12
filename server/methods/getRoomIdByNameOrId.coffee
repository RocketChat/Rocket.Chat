Meteor.methods
	getRoomIdByNameOrId: (rid) ->

		console.log '[methods] getRoomIdByNameOrId-> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		room = RocketChat.models.Rooms.findOneById rid

		if not room?
			room = RocketChat.models.Rooms.findOneByName rid

		if room?
			rid = room._id

		return rid
