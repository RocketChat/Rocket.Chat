RocketChat.unarchiveRoom = function(rid) {
	RocketChat.models.Rooms.unarchiveById(rid);
	RocketChat.models.Subscriptions.unarchiveByRoomId(rid);
};
