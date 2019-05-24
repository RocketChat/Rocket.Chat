import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

RocketChat.saveRoomMessageDelay = function(rid, messageDelay) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomMessageDelay',
		});
	}
	return RocketChat.models.Rooms.setMessageDelayById(rid, messageDelay);
};
