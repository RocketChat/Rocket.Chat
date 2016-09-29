RocketChat.archiveRoom = function(rid) {
	RocketChat.models.Rooms.archiveById(rid);
	RocketChat.models.Subscriptions.archiveByRoomId(rid);
};
