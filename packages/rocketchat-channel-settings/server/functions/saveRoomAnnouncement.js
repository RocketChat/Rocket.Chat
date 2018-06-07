import s from 'underscore.string';

RocketChat.saveRoomAnnouncement = function(rid, roomAnnouncement, user, sendMessage=true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomAnnouncement' });
	}

	let message;
	let announcementDetails;
	if (typeof roomAnnouncement === 'string') {
		message = roomAnnouncement;
	} else {
		({message, ...announcementDetails} = roomAnnouncement);
	}

	const escapedMessage = s.escapeHTML(message);

	const updated = RocketChat.models.Rooms.setAnnouncementById(rid, escapedMessage, announcementDetails);
	if (updated && sendMessage) {
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, escapedMessage, user);
	}

	return updated;
};
