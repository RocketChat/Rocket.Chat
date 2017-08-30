RocketChat.saveRoomTokens = function(rid, roomTokens) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomTokens'
		});
	}

	const escapedRoomTokens = s.escapeHTML(roomTokens);

	let tokens;

	if (escapedRoomTokens && escapedRoomTokens !== '') {
		tokens = escapedRoomTokens.replace(/\s/ig, '').split(',');
	}

	return RocketChat.models.Rooms.setTokensById(rid, tokens);
};
