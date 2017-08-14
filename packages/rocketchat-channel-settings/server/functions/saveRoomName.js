
RocketChat.saveRoomName = function(rid, displayName, user, sendMessage = true) {
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room.t !== 'c' && room.t !== 'p') {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			'function': 'RocketChat.saveRoomdisplayName'
		});
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
