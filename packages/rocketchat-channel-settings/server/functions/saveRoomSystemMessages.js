RocketChat.saveRoomSystemMessages = function(rid, systemMessages) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomSystemMessages'
		});
	}
	return RocketChat.models.Rooms.setSystemMessagesById(rid, systemMessages);
};
