RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = (type, roomId, message, user, extraData) ->
	return @createWithTypeRoomIdMessageAndUser type, roomId, message, user, extraData

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = (roomId, roomName, user, extraData) ->
	return @createWithTypeRoomIdMessageAndUser 'r', roomId, roomName, user, extraData
