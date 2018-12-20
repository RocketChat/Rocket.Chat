import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.saveRoomAnnouncement = function(rid, roomAnnouncement, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomAnnouncement' });
	}

	let message;
	let announcementDetails;
	if (typeof roomAnnouncement === 'string') {
		message = roomAnnouncement;
	} else {
		({ message, ...announcementDetails } = roomAnnouncement);
	}

	const updated = RocketChat.models.Rooms.setAnnouncementById(rid, message, announcementDetails);
	if (updated && sendMessage) {
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, message, user);
	}

	return updated;
};
