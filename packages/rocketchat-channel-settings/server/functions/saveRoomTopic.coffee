RocketChat.saveRoomTopic = (rid, roomTopic, user, sendMessage=true) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomTopic' }

	roomTopic = s.escapeHTML(roomTopic)

	update = RocketChat.models.Rooms.setTopicById(rid, roomTopic)

	if update and sendMessage
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_topic', rid, roomTopic, user

	return update
