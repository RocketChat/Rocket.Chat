
RocketChat.saveRoomAnnouncement = function(rid, roomAnnouncement, user, sendMessage=true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomAnnouncement' });
	}

	roomAnnouncement = encodeURI(roomAnnouncement);
	const updated = RocketChat.models.Rooms.setAnnouncementById(rid, roomAnnouncement);
	if (updated && sendMessage) {
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, roomAnnouncement, user);
	}

	return updated;
};
