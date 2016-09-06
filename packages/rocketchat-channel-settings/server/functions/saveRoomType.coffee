RocketChat.saveRoomType = (rid, roomType) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomType' }

	if roomType not in ['c', 'p']
		throw new Meteor.Error 'error-invalid-room-type', 'error-invalid-room-type', { type: roomType }

	return RocketChat.models.Rooms.setTypeById(rid, roomType) and RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType)
