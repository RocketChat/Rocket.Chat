RocketChat.eraseRoom = function(roomId) {
	RocketChat.models.Messages.removeByRoomId(roomId);
	RocketChat.models.Subscriptions.removeByRoomId(roomId);
	return RocketChat.models.Rooms.removeById(roomId);
};
