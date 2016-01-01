RocketChat.saveRoomType = (rid, roomType) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-rid'

	if roomType not in ['c', 'p']
		throw new Meteor.Error 'invalid-room-type', 'Invalid_room_type', { roomType: roomType }

	if roomType is 'p'
		RocketChat.models.Rooms.setUserById(rid, Meteor.user())

	return RocketChat.models.Rooms.setTypeById(rid, roomType) and RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType)
