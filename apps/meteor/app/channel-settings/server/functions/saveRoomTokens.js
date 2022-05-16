import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms } from '../../../models';

export const saveRoomTokenpass = function (rid, tokenpass) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokens',
		});
	}

	return Rooms.setTokenpassById(rid, tokenpass);
};
