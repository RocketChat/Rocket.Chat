RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = function(type, roomId, message, user, extraData) {
	return this.createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData);
};

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = function(roomId, roomName, user, extraData) {
	return this.createWithTypeRoomIdMessageAndUser('r', roomId, roomName, user, extraData);
};
