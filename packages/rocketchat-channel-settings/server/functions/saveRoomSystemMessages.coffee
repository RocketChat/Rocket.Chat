RocketChat.saveRoomSystemMessages = (rid, systemMessages, user) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomSystemMessages' }

	update = RocketChat.models.Rooms.setSystemMessagesById rid, systemMessages

	return update
