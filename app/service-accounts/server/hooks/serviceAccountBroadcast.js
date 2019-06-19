import { callbacks } from '../../../callbacks/server';
import { Rooms } from '../../../models/server';
import { sendMessage } from '../../../lib/server';

callbacks.add('beforeSaveMessage', (message, room) => {
	// abort if room is not with a service account broadcast room
	if (!room || !room.sa) {
		return message;
	}

	const rooms = Rooms.findDirectRoomContainingUsername(Meteor.user().username);
	for (const targetRoom of rooms) {
		sendMessage(Meteor.user(), { msg: message.msg }, targetRoom);
	}
	return message;
});