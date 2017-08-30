RocketChat.saveRoomTokensMinimumBalance = function(rid, roomTokensMinimumBalance) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomTokensMinimumBalance'
		});
	}

	const minimumTokenBalance = parseInt(s.escapeHTML(roomTokensMinimumBalance));

	return RocketChat.models.Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
