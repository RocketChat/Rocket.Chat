import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms } from '../../../models';
import { MessageTypes } from '../../../lib/server/lib/messageTypes';

export const saveRoomSystemMessages = function(rid, systemMessages) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	if (systemMessages && (!Match.test(systemMessages, [String]) || systemMessages.some((value) => !MessageTypes.includes(value)))) {
		throw new Meteor.Error('invalid-room', 'Invalid option', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	return Rooms.setSystemMessagesById(rid, systemMessages);
};
