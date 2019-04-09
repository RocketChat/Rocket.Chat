import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '../../../models';

export const saveRoomSystemMessages = function(rid, systemMessages) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	return Rooms.setSystemMessagesById(rid, systemMessages);
};
