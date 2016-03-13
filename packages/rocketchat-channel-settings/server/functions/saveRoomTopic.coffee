RocketChat.saveRoomTopic = (rid, roomTopic) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-rid'

	return RocketChat.models.Rooms.setTopicById(rid, roomTopic)
