RocketChat.saveRoomDescription = (rid, roomDescription, user) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomDescription' }

	roomDescription = s.escapeHTML(roomDescription)

	update = RocketChat.models.Rooms.setDescriptionById rid, roomDescription

	RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_description', rid, roomDescription, user

	return update
