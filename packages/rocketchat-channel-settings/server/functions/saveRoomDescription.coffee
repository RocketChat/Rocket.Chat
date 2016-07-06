RocketChat.saveRoomDescription = (rid, roomDescription) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-rid'

	return RocketChat.models.Rooms.setDescriptionById rid, roomDescription
