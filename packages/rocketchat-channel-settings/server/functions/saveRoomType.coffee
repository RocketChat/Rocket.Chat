RocketChat.saveRoomType = (rid, roomType, user, sendMessage=true) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomType' }

	if roomType not in ['c', 'p']
		throw new Meteor.Error 'error-invalid-room-type', 'error-invalid-room-type', { function: 'RocketChat.saveRoomType', type: roomType }

	room = RocketChat.models.Rooms.findOneById(rid);

	if not room?
		throw new Meteor.Error 'error-invalid-room', 'error-invalid-room', { function: 'RocketChat.saveRoomType', _id: rid }

	if room.t is 'd'
		throw new Meteor.Error 'error-direct-room', 'Can\'t change type of direct rooms', { function: 'RocketChat.saveRoomType' }

	result = RocketChat.models.Rooms.setTypeById(rid, roomType) and RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType)

	if result and sendMessage
		if roomType is 'c'
			message = TAPi18n.__('Channel', { lng: user?.language || RocketChat.settings.get('language') || 'en' })
		else
			message = TAPi18n.__('Private_Group', { lng: user?.language || RocketChat.settings.get('language') || 'en' })

		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_privacy', rid, message, user

	return result
