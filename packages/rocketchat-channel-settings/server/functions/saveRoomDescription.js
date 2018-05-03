import s from 'underscore.string';

RocketChat.saveRoomDescription = function(rid, roomDescription, user) {

	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomDescription'
		});
	}
	const escapedRoomDescription = s.escapeHTML(roomDescription);
	const update = RocketChat.models.Rooms.setDescriptionById(rid, escapedRoomDescription);
	RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, escapedRoomDescription, user);
	return update;
};
