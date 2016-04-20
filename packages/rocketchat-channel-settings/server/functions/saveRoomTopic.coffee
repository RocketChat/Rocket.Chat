RocketChat.saveRoomTopic = (rid, roomTopic) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomTopic' }

	return RocketChat.models.Rooms.setTopicById(rid, roomTopic)
