RocketChat.saveRoomTopic = (rid, roomTopic, user) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomTopic' }

	roomTopic = s.escapeHTML(roomTopic)

	update = RocketChat.models.Rooms.setTopicById(rid, roomTopic)

	return update
