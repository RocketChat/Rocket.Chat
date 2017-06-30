RocketChat.models.Messages.createRoomUnarchivedByRoomIdAndUser = function(roomId, user) {
	return this.createWithTypeRoomIdMessageAndUser('room-unarchived', roomId, '', user);
};
