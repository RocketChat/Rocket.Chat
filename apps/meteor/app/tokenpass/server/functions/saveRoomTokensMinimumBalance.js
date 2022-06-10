import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { Rooms } from '../../../models';

export const saveRoomTokensMinimumBalance = function (rid, roomTokensMinimumBalance) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokensMinimumBalance',
		});
	}

	const minimumTokenBalance = parseFloat(escapeHTML(roomTokensMinimumBalance));

	return Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
