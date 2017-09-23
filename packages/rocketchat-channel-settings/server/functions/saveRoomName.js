RocketChat.saveRoomName = function(rid, displayName, user, sendMessage = true) {
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room.t !== 'c' && room.t !== 'p') {
		// custom room types can explicitly enable/disable the channel settings support
		if (!(RocketChat.roomTypes[room.t].allowChangeChannelSettings && RocketChat.roomTypes[room.t].allowChangeChannelSettings())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				'function': 'RocketChat.saveRoomdisplayName'
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
