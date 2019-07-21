import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { sendMessage } from '../../../lib/server';
import { RateLimiter } from '../../../lib/server/lib';

const _sendBroadcastMessage = function(message) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendBroadcastMessage' });
	}

	if (!Meteor.user().u) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendBroadcastMessage' });
	}

	const rooms = Rooms.findDirectRoomContainingUsername(Meteor.user().username);
	for (const targetRoom of rooms) {
		sendMessage(Meteor.user(), { msg: message.msg }, targetRoom);
	}
};

export const sendBroadcastMessage = RateLimiter.limitFunction(_sendBroadcastMessage, 1, 8640000, {
	0() { return !Meteor.userId(); },
});
