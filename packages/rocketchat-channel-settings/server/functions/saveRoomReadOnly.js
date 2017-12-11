RocketChat.saveRoomReadOnly = function(rid, readOnly) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomReadOnly'
		});
	}
	return RocketChat.models.Rooms.setReadOnlyById(rid, readOnly);
};
