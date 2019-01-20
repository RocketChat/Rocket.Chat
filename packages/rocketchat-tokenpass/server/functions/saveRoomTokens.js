import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.saveRoomTokenpass = function(rid, tokenpass) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTokens',
		});
	}

	return RocketChat.models.Rooms.setTokenpassById(rid, tokenpass);
};
