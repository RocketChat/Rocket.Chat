RocketChat.saveRoomReadOnly = (rid, readOnly, user) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomReadOnly' }

	update = RocketChat.models.Rooms.setReadOnlyById rid, readOnly

	return update
