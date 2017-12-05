RocketChat.saveRoomTokenpass = function(rid, tokenpass) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomTokens'
		});
	}

	return RocketChat.models.Rooms.setTokenpassById(rid, tokenpass);
};
