Meteor.methods
	getRoomIdByNameOrId: (rid) ->

		room = RocketChat.models.Rooms.findOneById rid

		if not room?
			room = RocketChat.models.Rooms.findOneByName rid

		if room?
			rid = room._id

		return rid
