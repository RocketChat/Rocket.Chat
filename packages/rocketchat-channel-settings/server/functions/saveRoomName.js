RocketChat.saveRoomName = function(rid, displayName, user, sendMessage = true) {
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room.t !== 'c' && room.t !== 'p') {
		// custom room types can explicitly state they don't want to be renamed
		if (!(RocketChat.roomTypes[room.t].preventRenaming && RocketChat.roomTypes[room.t].preventRenaming())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				'function': 'RocketChat.saveRoomName'
			});
		}
	}
	if (displayName === room.name) {
		return;
	}

	const slugifiedRoomName = RocketChat.getValidRoomName(displayName, rid);

	const update = RocketChat.models.Rooms.setNameById(rid, slugifiedRoomName, displayName) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

	if (update && sendMessage) {
		RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
	}
	return displayName;
};
