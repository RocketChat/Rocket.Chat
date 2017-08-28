RocketChat.saveRoomTokens = function(rid, roomTokens, user) {

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

	const update = RocketChat.models.Rooms.setTokensById(rid, tokens);
	RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_tokens', rid, tokens, user);
	return update;
};
