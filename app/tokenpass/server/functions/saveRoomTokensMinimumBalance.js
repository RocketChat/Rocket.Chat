import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms } from '../../../models';
import { escapeHTML } from '../../../../lib/escapeHTML';

export const saveRoomTokensMinimumBalance = function(rid, roomTokensMinimumBalance) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokensMinimumBalance',
		});
	}

	const minimumTokenBalance = parseFloat(escapeHTML(roomTokensMinimumBalance));

	return Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
