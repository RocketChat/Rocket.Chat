RocketChat.saveRoomTokensMinimumBalance = function(rid, roomTokensMinimumBalance, user) {

	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomTokensMinimumBalance'
		});
	}

	const minimumTokenBalance = parseInt(s.escapeHTML(roomTokensMinimumBalance));

	const update = RocketChat.models.Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
	RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_tokens_minimum_balance', rid, minimumTokenBalance, user);
	return update;
};
