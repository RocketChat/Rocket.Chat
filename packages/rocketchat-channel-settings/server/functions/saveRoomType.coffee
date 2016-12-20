RocketChat.saveRoomType = (rid, roomType, user, sendMessage=true) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomType' }

	if roomType not in ['c', 'p']
		throw new Meteor.Error 'error-invalid-room-type', 'error-invalid-room-type', { type: roomType }

	result = RocketChat.models.Rooms.setTypeById(rid, roomType) and RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType)

	if result and sendMessage
		if roomType is 'c'
			message = TAPi18n.__('Channel', { lng: user?.language || RocketChat.settings.get('language') || 'en' })
		else
			message = TAPi18n.__('Private_Group', { lng: user?.language || RocketChat.settings.get('language') || 'en' })

		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_privacy', rid, message, user

	return result
