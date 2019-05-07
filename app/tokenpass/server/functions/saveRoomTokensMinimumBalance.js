import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '../../../models';
import s from 'underscore.string';

export const saveRoomTokensMinimumBalance = function(rid, roomTokensMinimumBalance) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokensMinimumBalance',
		});
	}

	const minimumTokenBalance = parseFloat(s.escapeHTML(roomTokensMinimumBalance));

	return Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
