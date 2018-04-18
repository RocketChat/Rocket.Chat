import s from 'underscore.string';

RocketChat.saveRoomAnnouncement = function(rid, roomAnnouncement, user, sendMessage=true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomAnnouncement' });
	}
	const announcementObject = typeof roomAnnouncement === 'object' ?
		roomAnnouncement :
		{
			message: roomAnnouncement
		};

	const escapedMessage = s.escapeHTML(announcementObject.message);
	const updated = RocketChat.models.Rooms.setAnnouncementById(rid, {...announcementObject, message: escapedMessage});
	if (updated && sendMessage) {
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, escapedMessage, user);
	}

	return updated;
};
