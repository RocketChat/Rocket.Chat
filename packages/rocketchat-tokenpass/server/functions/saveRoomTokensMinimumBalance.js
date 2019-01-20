import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import s from 'underscore.string';

RocketChat.saveRoomTokensMinimumBalance = function(rid, roomTokensMinimumBalance) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokensMinimumBalance',
		});
	}

	const minimumTokenBalance = parseFloat(s.escapeHTML(roomTokensMinimumBalance));

	return RocketChat.models.Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
