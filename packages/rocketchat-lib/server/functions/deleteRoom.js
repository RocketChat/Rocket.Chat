RocketChat.deleteRoom = function(rid) {
	RocketChat.models.Messages.removeFilesByRoomId(rid);
	RocketChat.models.Messages.removeByRoomId(rid);
	RocketChat.models.Subscriptions.removeByRoomId(rid);
	RocketChat.callbacks.run('afterDeleteRoom', rid);
	return RocketChat.models.Rooms.removeById(rid);
};
