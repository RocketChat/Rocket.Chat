RocketChat.callbacks.add('livechat.closeRoom', (room) => {
	if (!room || room.open) {
		return room;
	}

	if (room.servedBy) {
		RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
	}
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-hide-closed-room');
