import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { callbacks } from '../../../callbacks/server';
import { sendBroadcastMessage } from '../functions/sendBroadcastMessage';

callbacks.add('beforeSaveMessage', (message, room) => {
	// abort if room is not with a service account broadcast room
	if (!room || !room.sa) {
		return message;
	}
	const lastMessageDate = room.lastMessage.ts.getUTCDate() || null;
	const currentDate = message.ts.getUTCDate();
	if (!lastMessageDate || lastMessageDate !== currentDate) {
		sendBroadcastMessage(message);
	} else {
		throw new Error(`You can only send one broadcast message per day`);
	}
	return message;
});
